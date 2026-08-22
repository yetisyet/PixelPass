import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function Win7Dialog({
  children,
  description,
  footer,
  onOpenChange,
  open,
  title,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md gap-0 rounded-none bg-transparent p-0 ring-0"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="win7">
          <section className="window active glass pixelpass-dialog-window">
            <div className="title-bar">
              <div className="title-bar-text">{title}</div>
              <div className="title-bar-controls">
                <button
                  aria-label="Close"
                  type="button"
                  onClick={() => onOpenChange(false)}
                />
              </div>
            </div>

            <div className="window-body has-space">{children}</div>
            {footer && <footer className="pixelpass-dialog-footer">{footer}</footer>}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
