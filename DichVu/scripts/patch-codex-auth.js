const fs = require('fs');

const path = 'DichVu/src/components/CodexTopupClient.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add AuthRequiredModal import
const importTarget = 'import { formatVND } from "@/lib/product-types";';
const importReplace = `import { formatVND } from "@/lib/product-types";
import AuthRequiredModal from "@/components/AuthRequiredModal";`;

code = code.replace(importTarget, importReplace);

// 2. Add auth state & effect
const stateTarget = '  const [copiedMemo, setCopiedMemo] = useState(false);';
const stateReplace = `  const [copiedMemo, setCopiedMemo] = useState(false);

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

// 3. Guard in handleSubmitOrder
const guardTarget = `  const handleSubmitOrder = async () => {
    setCheckoutError(null);`;

const guardReplace = `  const handleSubmitOrder = async () => {
    setCheckoutError(null);

    // Bắt buộc đăng nhập để mua hàng và lưu đơn vào tài khoản
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }`;

code = code.replace(guardTarget, guardReplace);

// 4. Handle 401 requireAuth
const resTarget = `      const data = await res.json();

      if (!res.ok || !data.success) {
        setCheckoutError(data.error || "Không thể tạo đơn nạp credit");`;

const resReplace = `      const data = await res.json();

      if (res.status === 401 || data.requireAuth) {
        setShowAuthModal(true);
        setCheckoutError(data.error || "Vui lòng đăng nhập hoặc tạo tài khoản để nạp credit.");
        return;
      }

      if (!res.ok || !data.success) {
        setCheckoutError(data.error || "Không thể tạo đơn nạp credit");`;

code = code.replace(resTarget, resReplace);

// 5. Add AuthRequiredModal before final closing tag of page
const modalTarget = `      )}
    </div>
  );
}`;

const modalReplace = `      )}

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        callbackUrl="/nap-codex"
      />
    </div>
  );
}`;

code = code.replace(modalTarget, modalReplace);

fs.writeFileSync(path, code, 'utf8');
console.log('CodexTopupClient.tsx patched successfully');
