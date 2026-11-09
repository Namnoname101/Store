const fs = require('fs');

const path = 'DichVu/src/components/QuickViewModal.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add AuthRequiredModal import
const importTarget = 'import { resolveProductThumbnail } from "@/lib/catalog-grouping";';
const importReplace = `import { resolveProductThumbnail } from "@/lib/catalog-grouping";
import AuthRequiredModal from "@/components/AuthRequiredModal";`;

code = code.replace(importTarget, importReplace);

// 2. Add auth state & effect
const stateTarget = '  const [imgError, setImgError] = useState(false);';
const stateReplace = `  const [imgError, setImgError] = useState(false);

  // Authentication state for mandatory account-bound orders
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.authenticated && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingAuth(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);`;

code = code.replace(stateTarget, stateReplace);

// 3. In handleCheckout, guard with auth check
const checkoutGuardTarget = `  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminPreview) {
      setErrorMessage("Chế độ xem trước: Không thể thực hiện đặt hàng hoặc thanh toán.");
      return;
    }

    setErrorMessage(null);`;

const checkoutGuardReplace = `  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminPreview) {
      setErrorMessage("Chế độ xem trước: Không thể thực hiện đặt hàng hoặc thanh toán.");
      return;
    }

    // Bắt buộc đăng nhập để mua hàng và lưu đơn vào tài khoản
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    setErrorMessage(null);`;

code = code.replace(checkoutGuardTarget, checkoutGuardReplace);

// 4. Handle 401 requireAuth in fetch response
const resCheckTarget = `      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể tạo đơn hàng. Vui lòng thử lại.");
      }`;

const resCheckReplace = `      const data = await res.json();
      if (res.status === 401 || data.requireAuth) {
        setShowAuthModal(true);
        throw new Error(data.error || "Vui lòng đăng nhập hoặc tạo tài khoản để hoàn tất đơn hàng.");
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể tạo đơn hàng. Vui lòng thử lại.");
      }`;

code = code.replace(resCheckTarget, resCheckReplace);

// 5. Add UI notice above action buttons
const actionTarget = `          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">`;

const actionReplace = `          {/* Unauthenticated notice */}
          {!isLoadingAuth && !currentUser && (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="truncate">Cần tài khoản để lưu đơn vĩnh viễn</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="text-xs font-bold underline hover:opacity-80 shrink-0 cursor-pointer"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">`;

code = code.replace(actionTarget, actionReplace);

// 6. Add AuthRequiredModal before final closing tag of dialog
const modalTarget = `      </div>
    </div>
  );
}`;

const modalReplace = `      </div>

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        callbackUrl={product?.slug ? \`/products/\${product.slug}\` : undefined}
      />
    </div>
  );
}`;

code = code.replace(modalTarget, modalReplace);

fs.writeFileSync(path, code, 'utf8');
console.log('QuickViewModal.tsx patched successfully');
