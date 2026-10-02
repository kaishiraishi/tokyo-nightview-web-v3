import { useEffect, useMemo, useRef, useState } from 'react';
import { samplePotentialGrid, type MapLocation, type PotentialRawSample } from '../lib/potentialSampler';
import { buildPotentialViewModel, buildSampleGrid } from '../components/potential/prototypes/viewModel';
import type { PotentialRange } from '../components/potential/prototypes/types';

type Options = {
    center: MapLocation | null;
    range: PotentialRange;
    threshold: number;
};

// 1km 以内は常に同じ距離（1km）までサンプリングする。5km / 10km は、その範囲を選んだときに初めて遠方を追加で取得する
function samplingDistance(range: PotentialRange) {
    return Math.max(range, 1000);
}

// 選択地点ごとに 24 方向 × 距離をサンプリングする。threshold の変更や、取得済みの範囲より狭い range への変更は
// 再取得なしで ViewModel に反映する（広い range を選んだときだけ、足りない遠方を取り直す）。
export function usePotentialAnalysis({ center, range, threshold }: Options) {
    const [rawSamples, setRawSamples] = useState<PotentialRawSample[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const latestRequestId = useRef(0);
    // いま rawSamples が、どの地点を何 m まで取得したものか
    const covered = useRef<{ center: MapLocation; distance: number } | null>(null);

    useEffect(() => {
        if (!center) {
            latestRequestId.current += 1;
            covered.current = null;
            setRawSamples(null);
            setIsLoading(false);
            return;
        }

        const distance = samplingDistance(range);
        if (covered.current && covered.current.center === center && covered.current.distance >= distance) return;

        const requestId = ++latestRequestId.current;
        setIsLoading(true);
        setError(null);

        samplePotentialGrid(center, distance)
            .then((samples) => {
                if (requestId !== latestRequestId.current) return;
                if (samples.every((sample) => sample.value === null)) throw new Error('この地点のポテンシャルデータがありません');
                covered.current = { center, distance };
                setRawSamples(samples);
            })
            .catch((reason) => {
                if (requestId !== latestRequestId.current) return;
                covered.current = null;
                setRawSamples(null);
                setError(reason instanceof Error ? reason.message : 'ポテンシャルデータを取得できませんでした');
            })
            .finally(() => {
                if (requestId === latestRequestId.current) setIsLoading(false);
            });
    }, [center, range]);

    const viewModel = useMemo(
        () => (center && rawSamples ? buildPotentialViewModel(buildSampleGrid(center, rawSamples, range, threshold)) : null),
        [center, rawSamples, range, threshold],
    );

    return { rawSamples, viewModel, isLoading, error };
}
