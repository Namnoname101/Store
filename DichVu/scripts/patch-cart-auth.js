const fs = require('fs');

const path = 'DichVu/src/app/cart/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add AuthRequiredModal import
const importTarget = 'import { formatVND, getProductTypeInfo } from "@/lib/product-types";';
const importReplace = `import { formatVND, getProductTypeInfo } from "@/lib/product-types";
import AuthRequiredModal from "@/components/AuthRequiredModal";`;

code = code.replace(importTarget, importReplace);

// 2. Add auth state & effect
const stateTarget = '  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});';
const stateReplace = `  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

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
const checkoutGuardTarget = `    if (selectedItems.length === 0) {
      setErrorMessage("Vui lòng tích chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }`;

const checkoutGuardReplace = `    if (selectedItems.length === 0) {
      setErrorMessage("Vui lòng tích chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }

    // Bắt buộc đăng nhập để mua hàng và lưu đơn vào tài khoản
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }`;

code = code.replace(checkoutGuardTarget, checkoutGuardReplace);

// 4. Handle 401 requireAuth in fetch response
const resCheckTarget = `      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || "Không thể khởi tạo đơn hàng. Vui lòng thử lại.");
      }`;

const resCheckReplace = `      const orderData = await orderRes.json();
      if (orderRes.status === 401 || orderData.requireAuth) {
        setShowAuthModal(true);
        throw new Error(orderData.error || "Vui lòng đăng nhập hoặc tạo tài khoản để hoàn tất đơn hàng.");
      }
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || "Không thể khởi tạo đơn hàng. Vui lòng thử lại.");
      }`;

code = code.replace(resCheckTarget, resCheckReplace);

// 5. Add UI notice above submit button in cart
const submitTarget = `              {/* Submit Button */}
              <button
                type="submit"`;

const submitReplace = `              {/* Unauthenticated notice in cart */}
              {!isLoadingAuth && !currentUser && (
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 space-y-2 text-xs text-foreground mb-3">
                  <div className="flex items-center gap-2 font-bold text-primary">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Yêu cầu đăng nhập để thanh toán</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Đơn hàng và tài khoản/key sẽ được lưu trữ vĩnh viễn trong tài khoản của bạn để dễ dàng tra cứu và nhận bảo hành.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href="/login?callbackUrl=/cart"
                      className="flex-1 py-1.5 px-3 rounded-lg bg-primary text-primary-foreground text-center font-bold text-xs hover:bg-primary/90 transition-all min-h-[38px] flex items-center justify-center"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      href="/register?callbackUrl=/cart"
                      className="flex-1 py-1.5 px-3 rounded-lg border border-border bg-card text-center font-semibold text-xs hover:bg-secondary transition-all min-h-[38px] flex items-center justify-center"
                    >
                      Đăng ký ngay
                    </Link>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"`;

code = code.replace(submitTarget, submitReplace);

// 6. Add AuthRequiredModal before final closing tag of page
const modalTarget = `      )}
    </div>
  );
}`;

const modalReplace = `      )}

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        callbackUrl="/cart"
      />
    </div>
  );
}`;

code = code.replace(modalTarget, modalReplace);

fs.writeFileSync(path, code, 'utf8');
console.log('Cart page.tsx patched successfully');
