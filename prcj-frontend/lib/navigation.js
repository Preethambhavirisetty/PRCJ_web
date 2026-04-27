import { useLocation, useNavigate, useParams as useRRParams } from 'react-router-dom';
export function useRouter() {
    const navigate = useNavigate();
    return {
        push: (to) => navigate(to),
        replace: (to) => navigate(to, { replace: true }),
        back: () => navigate(-1),
        forward: () => navigate(1),
    };
}
export function usePathname() {
    return useLocation().pathname;
}
export function useSearchParams() {
    return new URLSearchParams(useLocation().search);
}
export function useParams() {
    return useRRParams();
}
