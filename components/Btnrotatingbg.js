const BtnRotatingBg = (props) => {
  return (
    <button className='px-6 sm:px-8 py-3 sm:py-3.5 bg-white hover:bg-[#F5F1E8] text-[#171717] font-semibold rounded-xl transition-all duration-200 active:scale-95 text-sm sm:text-base'>
      {props.children}
    </button>
  );
};

export default BtnRotatingBg;
