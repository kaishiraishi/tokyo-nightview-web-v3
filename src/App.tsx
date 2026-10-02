import { useState } from 'react';
import { PotentialMapView } from './components/potential/PotentialMapView';

type AppMode = 'explore' | 'analyze';

function App() {
    const [mode, setMode] = useState<AppMode>('explore');

    // 探索・投稿で同じ地図を使い続けるため、PotentialMapView は mode が変わっても unmount しない
    return (
        <div className="relative h-full w-full overflow-hidden bg-black">
            <PotentialMapView mode={mode} onModeChange={setMode} />
        </div>
    );
}

export default App;
