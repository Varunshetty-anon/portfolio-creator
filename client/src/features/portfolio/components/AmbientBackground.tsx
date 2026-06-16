import React from 'react';

export const AmbientBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#050505]">
      {/* Noise Texture Layer */}
      <div 
        className="absolute inset-0 z-10 opacity-[0.03] bg-repeat"
        style={{
          backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyBAMAAADsEZWCAAAAGFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/e4sZAAAABnRSTlMAAAAAAABupgeRAAAAPUlEQVR4AWMYBcMNAAR0IByQARiDBIEqBIEqBIFKEKkEERtEBhEBxAERQFQQEYQEoQoQhUQwKpg6Bo1wAAAa6Rk7x1x9wAAAAABJRU5ErkJggg==")`
        }}
      />
      
      {/* Cinematic Deep Core Blob */}
      <div 
        className="absolute top-[20%] left-[10%] w-[60vw] h-[60vw] min-w-[400px] min-h-[400px] rounded-full opacity-[0.12] blur-[100px] md:blur-[160px]"
        style={{ 
          background: 'radial-gradient(circle, #C0A36E 0%, transparent 60%)', 
          animation: 'ambient-blob1 35s infinite alternate ease-in-out' 
        }}
      />
      
      {/* Secondary Shadow Blob */}
      <div 
        className="absolute bottom-[10%] right-[-5%] w-[70vw] h-[70vw] min-w-[500px] min-h-[500px] rounded-full opacity-[0.08] blur-[120px] md:blur-[180px]"
        style={{ 
          background: 'radial-gradient(circle, #F5E6C8 0%, transparent 60%)', 
          animation: 'ambient-blob2 40s infinite alternate-reverse ease-in-out' 
        }}
      />

      <style>{`
        @keyframes ambient-blob1 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(15%, 5%) scale(1.05); }
          66% { transform: translate(5%, 15%) scale(0.95); }
          100% { transform: translate(-10%, -5%) scale(1.1); }
        }
        @keyframes ambient-blob2 {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-15%, -10%) scale(1.1); }
          66% { transform: translate(-5%, -20%) scale(0.9); }
          100% { transform: translate(10%, 10%) scale(1.05); }
        }
      `}</style>
    </div>
  );
};
