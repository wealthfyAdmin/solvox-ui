"use client"

export default function UnderConstruction() {
  return (
    <div className="rounded-xl border bg-background p-6">
      <div className="mx-auto max-w-2xl text-center">
        
       

        <h3 className="text-xl font-semibold dark:text-white">Under Construction</h3>
        <p className="mt-1 text-sm text-muted-foreground dark:text-white">
          We are building this section. Check back soon for tools integration and function calling.
        </p>
      </div>

      {/* Keyframes for stripes */}
      <style jsx>{`
        @keyframes stripes {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 48px 0;
          }
        }
      `}</style>
    </div>
  )
}
