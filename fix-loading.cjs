const fs = require('fs');
const path = 'src/App.tsx';
let src = fs.readFileSync(path, 'utf8');

const oldLine = `  if (loading) return <div style={{ color: '#F0EDE8', padding: '2rem' }}>Loading...</div>`;

const newBlock = `  if (loading) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0A0A0A',
      gap: '1.25rem'
    }}>
      <style>{\`
        @keyframes pwa-spin { to { transform: rotate(360deg); } }
        @keyframes pwa-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
      \`}</style>
      <img
        src="/app-icon.png"
        alt="Creator Accountability"
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          animation: 'pwa-pulse 1.4s ease-in-out infinite'
        }}
      />
      <div style={{
        width: '28px',
        height: '28px',
        border: '2px solid #1E1E1E',
        borderTopColor: '#F5A623',
        borderRadius: '50%',
        animation: 'pwa-spin 0.8s linear infinite'
      }} />
      <span style={{ color: '#555', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
        Loading...
      </span>
    </div>
  )`;

if (!src.includes(oldLine)) {
  console.error('❌ Could not find the exact loading line. Aborting.');
  process.exit(1);
}

src = src.replace(oldLine, newBlock);
fs.writeFileSync(path, src);
console.log('✅ App.tsx loading state replaced');
