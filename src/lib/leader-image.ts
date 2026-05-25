export function leaderImageSrc(idOrLeader: string | { id: string }): string {
  const id = typeof idOrLeader === "string" ? idOrLeader : idOrLeader.id;
  return `/api/leader-image/${encodeURIComponent(id)}`;
}
