import React from 'react';

const Loading = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-slate-700"></div>
    </div>
  );
};

export default Loading;