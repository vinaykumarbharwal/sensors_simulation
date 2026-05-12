interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`rounded-md bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.06)_100%)] animate-pulse ${className}`} />
}
