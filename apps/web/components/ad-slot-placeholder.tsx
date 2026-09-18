type Placement = "after-tool";

export function AdSlotPlaceholder({ placement, enabled = false }: { placement: Placement; enabled?: boolean }) {
  return <div className="ad-slot-placeholder container" data-placement={placement} data-ads-enabled={String(enabled)} aria-hidden="true" />;
}
