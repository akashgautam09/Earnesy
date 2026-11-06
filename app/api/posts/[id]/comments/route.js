import mongoose from 'mongoose'
import Post from '@/models/Post'
import Comment from '@/models/Comment'
import Payment from '@/models/Payment'
import User from '@/models/User'
import Notification from '@/models/Notification'
import { getCurrentUser } from '@/lib/auth/server'

const ensureDb = async () => {
  if (mongoose.connection.readyState !== 1) {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured')
    }
    await mongoose.connect(process.env.MONGODB_URI)
  }
}

// GET: Fetch comments for a post (with role badges & nested replies)
export async function GET(request, { params }) {
  try {
    await ensureDb()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid post ID' }, { status: 400 })
    }

    const post = await Post.findById(id).lean()
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    const currentUser = await getCurrentUser()

    // Access control for members-only posts
    if (post.visibility === 'members') {
      let hasAccess = false
      if (currentUser) {
        const isAuthor = currentUser._id.toString() === post.authorId.toString()
        if (isAuthor) {
          hasAccess = true
        } else {
          const isMember = await Payment.exists({
            creator_id: post.authorId,
            done: true,
            $or: [
              { supporter_id: currentUser._id },
              { from_user: currentUser.name },
              { from_user: currentUser.username },
            ],
          })
          hasAccess = Boolean(isMember)
        }
      }

      if (!hasAccess) {
        return Response.json({
          locked: true,
          error: 'Comments on this post are exclusive to supporters and members.',
          comments: [],
          totalCount: 0,
        }, { status: 403 })
      }
    }

    // Fetch all comments for this post
    const comments = await Comment.find({ postId: post._id })
      .sort({ createdAt: 1 })
      .populate('authorId', 'name username profileUrl')
      .lean()

    const authorIds = [
      ...new Set(
        comments
          .map((c) => c.authorId?._id?.toString())
          .filter(Boolean)
      ),
    ]

    // Fetch supporter/member status of all commenters relative to this creator
    const supporterPayments = await Payment.find({
      creator_id: post.authorId,
      done: true,
      supporter_id: { $in: authorIds },
    }).lean()

    const memberIds = new Set()
    const coffeeIds = new Set()

    for (const p of supporterPayments) {
      const sId = p.supporter_id?.toString()
      if (!sId) continue
      if (p.tier_id || p.tier_title) {
        memberIds.add(sId)
      } else {
        coffeeIds.add(sId)
      }
    }

    // Build threaded response with role badges
    const formatted = comments.map((c) => {
      const a = c.authorId || {}
      const aId = a._id?.toString()
      const isCreator = aId === post.authorId.toString()
      const isMember = memberIds.has(aId)
      const isCoffee = coffeeIds.has(aId)

      let roleBadge = null
      if (isCreator) roleBadge = 'creator'
      else if (isMember) roleBadge = 'member'
      else if (isCoffee) roleBadge = 'supporter'

      return {
        id: c._id.toString(),
        content: c.content,
        parentCommentId: c.parentCommentId ? c.parentCommentId.toString() : null,
        likesCount: c.likesCount || 0,
        createdAt: c.createdAt,
        author: {
          id: aId || '',
          name: a.name || 'Anonymous',
          username: a.username || '',
          profileUrl: a.profileUrl || null,
          roleBadge,
        },
        canDelete: Boolean(
          currentUser &&
          (currentUser._id.toString() === aId || currentUser._id.toString() === post.authorId.toString())
        ),
      }
    })

    // Separate into top-level comments and nested replies
    const topLevel = []
    const repliesMap = new Map()

    for (const item of formatted) {
      if (!item.parentCommentId) {
        topLevel.push({ ...item, replies: [] })
      } else {
        if (!repliesMap.has(item.parentCommentId)) {
          repliesMap.set(item.parentCommentId, [])
        }
        repliesMap.get(item.parentCommentId).push(item)
      }
    }

    for (const comment of topLevel) {
      comment.replies = repliesMap.get(comment.id) || []
    }

    return Response.json({
      success: true,
      comments: topLevel,
      totalCount: comments.length,
      isPostAuthor: Boolean(currentUser && currentUser._id.toString() === post.authorId.toString()),
    })
  } catch (error) {
    console.error('Comments GET error:', error)
    return Response.json({ error: error.message || 'Failed to load comments' }, { status: 500 })
  }
}

// POST: Add a new comment or reply
export async function POST(request, { params }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return Response.json({ error: 'Please log in to join the discussion.' }, { status: 401 })
    }

    await ensureDb()
    const { id } = await params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid post ID' }, { status: 400 })
    }

    const post = await Post.findById(id)
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    const isAuthor = currentUser._id.toString() === post.authorId.toString()

    // Access control for members-only posts
    if (post.visibility === 'members' && !isAuthor) {
      const isMember = await Payment.exists({
        creator_id: post.authorId,
        done: true,
        $or: [
          { supporter_id: currentUser._id },
          { from_user: currentUser.name },
          { from_user: currentUser.username },
        ],
      })

      if (!isMember) {
        return Response.json({
          error: 'Only members can comment on exclusive posts. Join a tier to participate!',
        }, { status: 403 })
      }
    }

    const body = await request.json()
    const cleanContent = typeof body.content === 'string' ? body.content.trim() : ''
    const parentCommentId =
      body.parentCommentId && mongoose.Types.ObjectId.isValid(body.parentCommentId)
        ? body.parentCommentId
        : null

    if (!cleanContent) {
      return Response.json({ error: 'Comment content cannot be empty.' }, { status: 400 })
    }

    if (cleanContent.length > 1000) {
      return Response.json({ error: 'Comment must be 1,000 characters or fewer.' }, { status: 400 })
    }

    // If replying to a comment, ensure parent exists
    if (parentCommentId) {
      const parentComment = await Comment.findOne({
        _id: parentCommentId,
        postId: post._id,
      })
      if (!parentComment) {
        return Response.json({ error: 'Parent comment not found.' }, { status: 404 })
      }
    }

    const newComment = await Comment.create({
      postId: post._id,
      authorId: currentUser._id,
      content: cleanContent,
      parentCommentId,
    })

    // Increment post comments count
    await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } })

    // Notify post author if comment is from someone else
    if (post.authorId.toString() !== currentUser._id.toString()) {
      try {
        await Notification.create({
          userId: post.authorId,
          type: 'comment',
          fromName: currentUser.name || 'A supporter',
          title: 'New comment on your post',
          message: `${currentUser.name || 'A supporter'} commented: "${cleanContent.slice(0, 70)}${cleanContent.length > 70 ? '...' : ''}"`,
          link: `/post/${post._id}#discussion`,
        })
      } catch (e) {
        console.error('Failed to create comment notification:', e)
      }
    }

    return Response.json({
      success: true,
      comment: {
        id: newComment._id.toString(),
        content: newComment.content,
        parentCommentId: parentCommentId ? parentCommentId.toString() : null,
        likesCount: 0,
        createdAt: newComment.createdAt,
        author: {
          id: currentUser._id.toString(),
          name: currentUser.name || 'Anonymous',
          username: currentUser.username || '',
          profileUrl: currentUser.profileUrl || null,
          roleBadge: isAuthor ? 'creator' : 'member',
        },
        canDelete: true,
        replies: [],
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Comment POST error:', error)
    return Response.json({ error: error.message || 'Failed to submit comment' }, { status: 500 })
  }
}

// DELETE: Remove a comment
export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return Response.json({ error: 'Unauthorized: Please login first' }, { status: 401 })
    }

    await ensureDb()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      return Response.json({ error: 'Valid comment ID is required' }, { status: 400 })
    }

    const post = await Post.findById(id).select('authorId').lean()
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return Response.json({ error: 'Comment not found' }, { status: 404 })
    }

    const isCommentAuthor = comment.authorId.toString() === currentUser._id.toString()
    const isPostAuthor = post.authorId.toString() === currentUser._id.toString()

    if (!isCommentAuthor && !isPostAuthor) {
      return Response.json({ error: 'You do not have permission to delete this comment' }, { status: 403 })
    }

    // Delete comment and any direct replies to it
    const deleteResult = await Comment.deleteMany({
      $or: [{ _id: comment._id }, { parentCommentId: comment._id }],
    })

    const deletedCount = deleteResult.deletedCount || 1
    await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: -deletedCount } })

    return Response.json({ success: true, deletedCount })
  } catch (error) {
    console.error('Comment DELETE error:', error)
    return Response.json({ error: error.message || 'Failed to delete comment' }, { status: 500 })
  }
}
