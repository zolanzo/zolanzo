import {
  // Navigation
  Home,
  Compass,
  Briefcase,
  MessageSquare,
  Wallet,
  CreditCard,
  Bell,
  User,
  LayoutDashboard,
  Users,
  Building,
  Settings,
  HelpCircle,
  LogOut,
  // Actions
  Search,
  Filter,
  ArrowUpDown,
  Menu,
  X,
  Plus,
  Edit,
  Trash2,
  Save,
  Upload,
  Download,
  Share2,
  RotateCw,
  Copy,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ThumbsUp,
  Brain,
  PenTool,
  Keyboard,
  Grid2X2,
  // Verification
  BadgeCheck,
  Badge,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Fingerprint,
  Contact,
  Award,
  // Finance
  Landmark,
  Coins,
  Receipt,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Vault,
  // Communication
  Mail,
  Phone,
  MessageCircle,
  Video,
  // Files
  Folder,
  File,
  Image as ImageIcon,
  Camera,
  Paperclip,
  // Analytics
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  // Misc
  Calendar,
  Clock,
  Globe,
  Languages,
  QrCode,
  Star,
  Heart,
  Bookmark,
  Gift,
  Trophy,
  Flame,
  Sparkles,
  // Category Icons
  Bot,
  ClipboardList,
  Clapperboard,
  Palette,
  Mic,
  Database,
  Tag,
  Headphones,
  UserCheck,
  Bug,
  Code2,
  Smartphone,
  Layout,
  Megaphone,
  ShoppingBag,
  ShieldAlert,
  MapPin,
  Truck,
  Calculator,
  GraduationCap,
  Stethoscope,
  Scale,
  Wrench,
  Sprout,
  PackageCheck,
  Factory,
  Utensils,
  Shirt,
  PartyPopper,
  MoreHorizontal,
} from "lucide-react";

import {
  BrandIcon,
  FacebookSvg,
  InstagramSvg,
  TikTokSvg,
  YouTubeSvg,
  XSvg,
  TwitterSvg,
  WhatsAppSvg,
  TelegramSvg,
  LinkedInSvg,
  DiscordSvg,
  GoogleSvg,
  MicrosoftSvg,
  AppleSvg,
} from "@/components/ui/brand-icons";

/**
 * Category Icons Registry - Mapping all 37 required job categories to Lucide icons
 */
export const CategoryIconsRegistry = {
  "Social Media": Share2,
  socialMedia: Share2,
  "AI Training": Bot,
  aiTraining: Bot,
  Surveys: ClipboardList,
  surveys: ClipboardList,
  Writing: FileText,
  writing: FileText,
  "Content Creation": Clapperboard,
  contentCreation: Clapperboard,
  "Graphic Design": Palette,
  graphicDesign: Palette,
  "Video Editing": Video,
  videoEditing: Video,
  Photography: Camera,
  photography: Camera,
  "Voice Recording": Mic,
  voiceRecording: Mic,
  Translation: Languages,
  translation: Languages,
  "Data Entry": Database,
  dataEntry: Database,
  "Data Annotation": Tag,
  dataAnnotation: Tag,
  "Customer Support": Headphones,
  customerSupport: Headphones,
  "Virtual Assistant": UserCheck,
  virtualAssistant: UserCheck,
  "Software Testing": Bug,
  softwareTesting: Bug,
  "Web Development": Code2,
  webDevelopment: Code2,
  "Mobile Development": Smartphone,
  mobileDevelopment: Smartphone,
  "UI/UX Design": Layout,
  uiUxDesign: Layout,
  Marketing: Megaphone,
  marketing: Megaphone,
  Sales: ShoppingBag,
  sales: ShoppingBag,
  Research: Search,
  research: Search,
  Moderation: ShieldAlert,
  moderation: ShieldAlert,
  "Field Tasks": MapPin,
  fieldTasks: MapPin,
  Delivery: Truck,
  delivery: Truck,
  Finance: Landmark,
  finance: Landmark,
  Accounting: Calculator,
  accounting: Calculator,
  Education: GraduationCap,
  education: GraduationCap,
  Healthcare: Stethoscope,
  healthcare: Stethoscope,
  Legal: Scale,
  legal: Scale,
  Engineering: Wrench,
  engineering: Wrench,
  Agriculture: Sprout,
  agriculture: Sprout,
  Logistics: PackageCheck,
  logistics: PackageCheck,
  Manufacturing: Factory,
  manufacturing: Factory,
  Hospitality: Utensils,
  hospitality: Utensils,
  "Beauty & Fashion": Shirt,
  beautyFashion: Shirt,
  Events: PartyPopper,
  events: PartyPopper,
  Other: MoreHorizontal,
  other: MoreHorizontal,
} as const;

/**
 * System Icons Registry - Categorized Lucide System Icons
 */
export const NavigationIcons = {
  home: Home,
  explore: Compass,
  jobs: Briefcase,
  messages: MessageSquare,
  wallet: Wallet,
  payments: CreditCard,
  notifications: Bell,
  profile: User,
  dashboard: LayoutDashboard,
  teams: Users,
  organization: Building,
  settings: Settings,
  help: HelpCircle,
  logout: LogOut,
} as const;

export const ActionIcons = {
  search: Search,
  filter: Filter,
  sort: ArrowUpDown,
  menu: Menu,
  close: X,
  add: Plus,
  edit: Edit,
  delete: Trash2,
  save: Save,
  upload: Upload,
  download: Download,
  share: Share2,
  refresh: RotateCw,
  copy: Copy,
  forward: ArrowRight,
  back: ArrowLeft,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  thumbsUp: ThumbsUp,
  brain: Brain,
  penTool: PenTool,
  headphones: Headphones,
  keyboard: Keyboard,
  grid: Grid2X2,
  trendingUp: TrendingUp,
} as const;

export const VerificationIcons = {
  verified: BadgeCheck,
  badge: Badge,
  shield: Shield,
  shieldCheck: ShieldCheck,
  lock: Lock,
  unlock: Unlock,
  fingerprint: Fingerprint,
  identity: Contact,
  certificate: Award,
} as const;

export const FinanceIcons = {
  wallet: Wallet,
  card: CreditCard,
  bank: Landmark,
  coins: Coins,
  receipt: Receipt,
  invoice: FileText,
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  escrow: Vault,
} as const;

export const CommunicationIcons = {
  mail: Mail,
  phone: Phone,
  chat: MessageCircle,
  bell: Bell,
  video: Video,
} as const;

export const FileIcons = {
  folder: Folder,
  file: File,
  image: ImageIcon,
  camera: Camera,
  paperclip: Paperclip,
} as const;

export const AnalyticsIcons = {
  chart: BarChart3,
  pieChart: PieChart,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  activity: Activity,
  target: Target,
} as const;

export const MiscIcons = {
  calendar: Calendar,
  clock: Clock,
  globe: Globe,
  language: Languages,
  qrCode: QrCode,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  gift: Gift,
  trophy: Trophy,
  fire: Flame,
  sparkles: Sparkles,
} as const;

export const BrandIconsRegistry = {
  facebook: FacebookSvg,
  instagram: InstagramSvg,
  tiktok: TikTokSvg,
  youtube: YouTubeSvg,
  x: XSvg,
  twitter: TwitterSvg,
  whatsapp: WhatsAppSvg,
  telegram: TelegramSvg,
  linkedin: LinkedInSvg,
  discord: DiscordSvg,
  google: GoogleSvg,
  microsoft: MicrosoftSvg,
  apple: AppleSvg,
  brandIcon: BrandIcon,
} as const;

/**
 * Unified Central ZOLANZO Icon Registry
 * All UI pages & components MUST import icons exclusively via:
 * `import { Icons } from "@/lib/icon-registry";`
 */
export const Icons = {
  // Brand SVGs & Component
  ...BrandIconsRegistry,

  // Navigation Icons
  ...NavigationIcons,

  // Action Icons
  ...ActionIcons,

  // Verification Icons
  ...VerificationIcons,

  // Finance Icons
  ...FinanceIcons,

  // Communication Icons
  ...CommunicationIcons,

  // File Icons
  ...FileIcons,

  // Analytics Icons
  ...AnalyticsIcons,

  // Misc Icons
  ...MiscIcons,

  // Category Registry
  categories: CategoryIconsRegistry,
} as const;

export type IconName = keyof typeof Icons;
