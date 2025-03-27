// Enhanced Modal Component
// This can be placed in a utility file like src/components/common/Modal.tsx
import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  showCloseButton?: boolean;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  fullWidth = false,
  showCloseButton = true,
  closeOnEsc = true,
  closeOnOverlayClick = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === "Escape") {
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === overlayRef.current) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevent body scroll

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = ""; // Restore body scroll
      };
    }
  }, [isOpen, handleKeyDown]);

  // Handle modal animation
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.classList.add("modal-enter");

      const timer = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.classList.remove("modal-enter");
          modalRef.current.classList.add("modal-entered");
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleOverlayClick}
      style={{
        backgroundColor: "rgba(17, 24, 39, 0.75)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        ref={modalRef}
        className={`bg-blue-950 border border-blue-800/50 rounded-xl shadow-2xl ${
          fullWidth ? "w-full max-w-4xl" : "max-w-lg w-11/12"
        } max-h-[90vh] overflow-auto ${className} modal-animation`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex justify-between items-center p-4 border-b border-blue-800/50">
            <h3 className="text-xl font-medium text-white">{title}</h3>
            {showCloseButton && (
              <button
                className="text-blue-400 hover:text-white transition-colors focus:outline-none p-1"
                onClick={onClose}
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            )}
          </div>
        )}

        <div className="p-4">{children}</div>
      </div>

      <style>{`
        .modal-animation {
          transform: scale(0.95);
          opacity: 0;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .modal-enter {
          transform: scale(0.95);
          opacity: 0;
        }

        .modal-entered {
          transform: scale(1);
          opacity: 1;
        }
      `}</style>
    </div>,
    document.body
  );
};