import { useEffect, useMemo, useRef, useState } from 'react';
import { samplePotentialGrid, type MapLocation, type PotentialRawSample } from '../lib/potentialSampler';
import { buildPotentialViewModel, buildSampleGrid } from '../components/potential/prototypes/viewModel';
import type { PotentialRange } from '../components/potential/prototypes/types';

type Options = {
    center: MapLocation | null;
    range: PotentialRange;
    threshold: number;
};

// 選択地点ごとに 24方向×9距離を 1 回だけサンプリングし、range / threshold の変更は再取得なしで ViewModel に反映する。
export function usePotentialAnalysis({ center, range, threshold }: Options) {
    const [rawSamples, setRawSamples] = useState<PotentialRawSample[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const latestRequestId = useRef(0);

    useEffect(() => {
        if (!center) {
            latestRequestId.current += 1;
            setRawSamples(null);
            setIsLoading(false);
            return;
        }

        const requestId = ++latestRequestId.current;
        setIsLoading(true);
        setError(null);

        samplePotentialGrid(center)
            .then((samples) => {
                if (requestId !== latestRequestId.current) return;
                if (samples.every((sample) => sample.value === null)) throw new Error('この地点のポテンシャルデータがありません');
                setRawSamples(samples);
            })
            .catch((reason) => {
                if (requestId !== latestRequestId.current) return;
                setRawSamples(null);
                setError(reason instanceof Error ? reason.message : 'ポテンシャルデータを取得できませんでした');
            })
            .finally(() => {
                if (requestId === latestRequestId.current) setIsLoading(false);
            });
    }, [center]);

    const viewModel = useMemo(
        () => (center && rawSamples ? buildPotentialViewModel(buildSampleGrid(center, rawSamples, range, threshold)) : null),
        [center, rawSamples, range, threshold],
    );

    return { rawSamples, viewModel, isLoading, error };
}
