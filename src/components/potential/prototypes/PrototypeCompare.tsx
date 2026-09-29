import { PrototypeCard } from './PrototypeCard';
import { PROTOTYPE_META, PrototypeView, prototypeSubtitle } from './PrototypeViews';
import type { PotentialViewModel, PrototypeType } from './types';

const ORDER: PrototypeType[] = ['field', 'polar'];

export function PrototypeCompare({ data, isUpdating }: { data: PotentialViewModel; isUpdating: boolean }) {
    return (
        <div className="grid grid-cols-2 gap-2">
            {ORDER.map((type) => (
                <PrototypeCard key={type} title={PROTOTYPE_META[type].title} subtitle={prototypeSubtitle(type, data)} isUpdating={isUpdating}>
                    <PrototypeView type={type} data={data} />
                </PrototypeCard>
            ))}
        </div>
    );
}
