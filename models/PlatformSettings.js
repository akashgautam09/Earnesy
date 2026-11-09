import mongoose from 'mongoose'

const platformSettingsSchema = new mongoose.Schema(
  {
    globalFeePercentage: {
      type: Number,
      default: 2,
      min: 0,
      max: 100,
    },
    minPayoutAmountPaise: {
      type: Number,
      default: 10000, // ₹100
      min: 100, // minimum ₹1
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    announcement: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: '', trim: true, maxlength: 300 },
      level: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
      link: { type: String, default: '', trim: true },
    },
    updatedBy: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
)

if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.PlatformSettings
}

const PlatformSettings =
  mongoose.models.PlatformSettings || mongoose.model('PlatformSettings', platformSettingsSchema)

export async function getPlatformSettings() {
  if (mongoose.connection.readyState !== 1) {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI)
    }
  }

  let settings = await PlatformSettings.findOne().lean()
  if (!settings) {
    const created = await PlatformSettings.create({
      globalFeePercentage: 2,
      minPayoutAmountPaise: 10000,
      maintenanceMode: false,
      announcement: { enabled: false, message: '', level: 'info', link: '' },
    })
    settings = created.toObject()
  }
  return settings
}

export default PlatformSettings
