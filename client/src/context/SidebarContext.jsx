import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const SidebarContext = createContext(null);

// Routes where the persistent rail gives way to a temporary overlay drawer,
// so the player gets the full width of the window.
const OVERLAY_ROUTES = [/^\/watch\//];

export const SidebarProvider = ({ children }) => {
  const { pathname } = useLocation();

  const [isExpanded, setIsExpanded] = useState(true);
  // One drawer serves both the mobile breakpoint and the overlay routes.
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const overlayMode = OVERLAY_ROUTES.some((pattern) => pattern.test(pathname));

  // Auto collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      setIsExpanded(window.innerWidth >= 1280);
      if (window.innerWidth >= 1024) {
        setIsDrawerOpen((open) => (overlayMode ? open : false));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [overlayMode]);

  // A drawer left open should not follow the user to the next page.
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Close on Escape while the drawer is floating over the page.
  useEffect(() => {
    if (!isDrawerOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDrawerOpen]);

  const toggleSidebar = useCallback(() => {
    // On the overlay routes — and on small screens — the hamburger opens the
    // floating drawer instead of resizing the page.
    if (overlayMode || window.innerWidth < 1024) {
      setIsDrawerOpen((prev) => !prev);
    } else {
      setIsExpanded((prev) => !prev);
    }
  }, [overlayMode]);

  const closeMobileSidebar = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        isMobileOpen: isDrawerOpen,
        overlayMode,
        toggleSidebar,
        closeMobileSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
