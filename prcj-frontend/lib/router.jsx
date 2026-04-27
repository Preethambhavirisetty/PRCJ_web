import { Link as RouterLink, NavLink, Navigate, Outlet, Route, Routes, BrowserRouter } from 'react-router-dom';

export function Link({ href, to, ...props }) {
  return <RouterLink to={to ?? href ?? '/'} {...props} />;
}

export { NavLink, Navigate, Outlet, Route, Routes, BrowserRouter };
