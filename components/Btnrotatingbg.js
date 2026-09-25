const BtnRotatingBg = (props) => {
  return (
    <button className='px-6 sm:px-8 py-3 sm:py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold rounded-xl transition-all duration-200 active:scale-95 text-sm sm:text-base'>
      {props.children}
    </button>
  );
};

export default BtnRotatingBg;
