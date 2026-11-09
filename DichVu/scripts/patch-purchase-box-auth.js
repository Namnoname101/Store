const fs = require('fs');

const path = 'DichVu/src/components/ProductPurchaseBox.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add AuthRequiredModal import
const importTarget = 'import { useCart } from "@/contexts/CartContext";';
const importReplace = `import { useCart } from "@/contexts/CartContext";
import AuthRequiredModal from "@/components/AuthRequiredModal";`;

code = code.replace(importTarget, importReplace);

// 2. Add auth state & effect
const stateTarget = '  const [errorMessage, setErrorMessage] = useState<string | null>(null);';
const stateReplace = `  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setErrorMessage(null);`;

const checkoutGuardReplace = `  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Bắt buộc đăng nhập để mua hàng và lưu đơn vào tài khoản
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }`;

code = code.replace(checkoutGuardTarget, checkoutGuardReplace);

// 4. Handle 401 requireAuth in fetch response
const resCheckTarget = `      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể khởi tạo đơn hàng. Vui lòng thử lại sau.");
      }`;

const resCheckReplace = `      const data = await res.json();

      if (res.status === 401 || data.requireAuth) {
        setShowAuthModal(true);
        throw new Error(data.error || "Vui lòng đăng nhập hoặc tạo tài khoản để hoàn tất đơn hàng.");
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể khởi tạo đơn hàng. Vui lòng thử lại sau.");
      }`;

code = code.replace(resCheckTarget, resCheckReplace);

// 5. Add UI banner above action buttons
const actionTarget = `        {/* Action Buttons: Add to cart + Buy Now */}
        <div>`;

const actionReplace = `        {/* Unauthenticated notice */}
        {!isLoadingAuth && !currentUser && (
          <div className="flex items-center justify-between gap-2.5 p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">Cần đăng nhập tài khoản để lưu đơn vĩnh viễn</span>
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

        {/* Action Buttons: Add to cart + Buy Now */}
        <div>`;

code = code.replace(actionTarget, actionReplace);

// 6. Add <AuthRequiredModal /> before final closing tag
const modalTarget = `      {/* Basic product notes */}
      <div className="mt-5 pt-4 border-t border-border space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Thanh toán quét mã VietQR nhận thông tin tự động</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" />
          <span>Hỗ trợ kỹ thuật và bảo hành theo thời hạn gói</span>
        </div>
      </div>
    </div>`;

const modalReplace = `      {/* Basic product notes */}
      <div className="mt-5 pt-4 border-t border-border space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Thanh toán quét mã VietQR nhận thông tin tự động</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" />
          <span>Hỗ trợ kỹ thuật và bảo hành theo thời hạn gói</span>
        </div>
      </div>

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        callbackUrl={slug ? \`/products/\${slug}\` : undefined}
      />
    </div>`;

code = code.replace(modalTarget, modalReplace);

fs.writeFileSync(path, code, 'utf8');
console.log('ProductPurchaseBox.tsx patched successfully');
