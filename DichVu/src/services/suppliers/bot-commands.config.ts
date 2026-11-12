/**
 * SINGLE SOURCE OF TRUTH (SSOT): BỘ ĐỊNH NGHĨA LỆNH CHAT & LUỒNG TƯƠNG TÁC CHO CÁC BOT NCC
 * Cập nhật trực tiếp từ hệ thống Telegram Userbot ngày 12/11/2026.
 */

export interface BotCommandDefinition {
  code: string;
  username: string;
  name: string;
  architecture: "CUSTOM_INLINE" | "CANBOSO_INLINE" | "DBOT_REPLY_KEYBOARD" | "CATEGORIZED_INLINE";
  commands: {
    start: string;
    buyOrProducts: string;
    balance?: string;
    wallet?: string;
    support?: string;
  };
  navigationFlow: {
    entryType: "SLASH_COMMAND" | "TEXT_KEYBOARD" | "INLINE_CALLBACK";
    stepByStep: string[];
  };
  categoryMappings?: Record<string, string>;
}

export const SUPPLIER_BOT_REGISTRY: Record<string, BotCommandDefinition> = {
  XOAINON_TELE: {
    code: "XOAINON_TELE",
    username: "shopxoainon_bot",
    name: "Shop Xoài Non",
    architecture: "CUSTOM_INLINE",
    commands: {
      start: "/start",
      buyOrProducts: "/buy",
      balance: "/balance",
      support: "/support",
    },
    navigationFlow: {
      entryType: "SLASH_COMMAND",
      stepByStep: [
        "1. Gửi lệnh /buy để mở thẳng danh mục sản phẩm (không cần qua menu /start)",
        "2. Bấm vào callback 'product:view:<id>' để xem chi tiết sản phẩm",
        "3. Bấm vào callback 'buyqty:<id>:<qty>' để chọn số lượng",
        "4. Bấm vào callback 'pay:wallet:<id>:<qty>' để thanh toán qua ví",
        "5. Nhận kết quả bàn giao định dạng Email | Pass | 2FA trực tiếp trong chat",
      ],
    },
  },

  DKEY_TELE: {
    code: "DKEY_TELE",
    username: "dkeyshop_bot",
    name: "DKeyShop MMO",
    architecture: "CANBOSO_INLINE",
    commands: {
      start: "/start",
      buyOrProducts: "/products", // Chú ý: Bot không nhận /sanpham, phải dùng /products
      wallet: "/wallet",
      support: "/support",
    },
    navigationFlow: {
      entryType: "SLASH_COMMAND",
      stepByStep: [
        "1. Gửi lệnh /products hoặc gửi /start rồi bấm callback 'menu::buy'",
        "2. Bấm vào chuyên mục tương ứng: products_category::<cat_id>",
        "3. Bấm vào nút sản phẩm: product_id::<product_code>",
        "4. Gửi số lượng bằng tin nhắn văn bản (ví dụ: '1')",
        "5. Bấm callback 'pay_method::wallet' để xác nhận thanh toán",
      ],
    },
    categoryMappings: {
      ChatGPT: "products_category::d7b2a409b7ed08d2",
      CapCut: "products_category::e9a30951852e98a2",
      Claude: "products_category::85b6206de528b4ab",
      Grok: "products_category::ea77a35954109b82",
      Netflix: "products_category::6839ac01fff70f6f",
      Kling: "products_category::5c7d32ac2d24c7f9",
      Wink: "products_category::675e9bd10c28e5ab",
    },
  },

  DSHOP_TELE: {
    code: "DSHOP_TELE",
    username: "mmo_dshop_bot",
    name: "MMO D-Shop",
    architecture: "CATEGORIZED_INLINE",
    commands: {
      start: "/start",
      buyOrProducts: "buy", // Callback from /start
      balance: "/me",
      wallet: "/me",
    },
    navigationFlow: {
      entryType: "INLINE_CALLBACK",
      stepByStep: [
        "1. Gửi lệnh /start",
        "2. Bấm callback 'buy' (🛒 Mua hàng)",
        "3. Bấm chuyên mục cat:<id> (ChatGPT là cat:4)",
        "4. Bấm sản phẩm prod:<cat>:<index> (ví dụ prod:4:2)",
        "5. Bấm số lượng 'qty:...'",
        "6. Bấm thanh toán 'pay:wallet'",
      ],
    },
    categoryMappings: {
      ChatGPT: "cat:4",
    },
  },

  CHODAUMOI_TELE: {
    code: "CHODAUMOI_TELE",
    username: "chodaumoi_bot",
    name: "Chợ Đầu Mối MMO",
    architecture: "DBOT_REPLY_KEYBOARD",
    commands: {
      start: "/start",
      buyOrProducts: "Sản phẩm", // Custom ReplyKeyboardMarkup text message
      wallet: "Ví",
      support: "Liên hệ",
    },
    navigationFlow: {
      entryType: "TEXT_KEYBOARD",
      stepByStep: [
        "1. Gửi lệnh /start để khởi tạo phiên",
        "2. Gửi tin nhắn text 'Sản phẩm' (bằng ReplyKeyboardMarkup)",
        "3. Nhận danh sách inline categories và bấm 'category|<name>' (ví dụ: category|ChatGPT)",
        "4. Chọn sản phẩm 'product|<product_id>'",
        "5. Xác nhận trừ tiền trong ví tự động",
      ],
    },
    categoryMappings: {
      ChatGPT: "category|ChatGPT",
      CapCut: "category|CapCut",
      Adobe: "category|Adobe",
      Grok: "category|Grok",
      Google: "category|Google",
    },
  },

  HIHISTORE_TELE: {
    code: "HIHISTORE_TELE",
    username: "hihistorebot",
    name: "PQV Store (HiHiStore)",
    architecture: "CANBOSO_INLINE",
    commands: {
      start: "/start",
      buyOrProducts: "/sanpham",
      wallet: "/nap",
    },
    navigationFlow: {
      entryType: "SLASH_COMMAND",
      stepByStep: [
        "1. Gửi lệnh /sanpham",
        "2. Bấm danh mục nhóm cat_view_<cat_id> (chuyên mục AI là cat_view_cat_53b29d0b)",
        "3. Bấm sản phẩm prod_view_product_<id>",
        "4. Xác nhận số lượng và thanh toán",
      ],
    },
    categoryMappings: {
      AI: "cat_view_cat_53b29d0b",
      Mail: "cat_view_cat_32948291",
    },
  },

  NGHIENTRICK_TELE: {
    code: "NGHIENTRICK_TELE",
    username: "nghientrickshop_bot",
    name: "Nghiện Trick Shop",
    architecture: "CUSTOM_INLINE",
    commands: {
      start: "/start",
      buyOrProducts: "menu_shop", // Callback from /start
      balance: "/me",
    },
    navigationFlow: {
      entryType: "INLINE_CALLBACK",
      stepByStep: [
        "1. Gửi /start",
        "2. Bấm callback 'menu_shop' (🛒 Mua hàng)",
        "3. Bấm chuyên mục shopcat_<id>",
        "4. Bấm sản phẩm prod_<id>",
        "5. Bấm số lượng qty_<n> và xác nhận pay_wallet",
      ],
    },
  },
};
