import React from "react"
import { 
  Trophy, 
  Users, 
  Gamepad2, 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Star,
  Crown,
  Target,
  Zap,
  TrendingUp,
  Award,
  Medal,
  Flame,
  Activity,
  BarChart3,
  Timer,
  User,
  UserCheck,
  UserPlus,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Filter,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  X,
  Check,
  ExternalLink,
  Share2,
  Heart,
  Bookmark,
  MessageCircle,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  SignalHigh,
  SignalLow,
  SignalZero,
  WifiOff as ConnectionOff,
  Wifi as ConnectionOn,
  Info,
  type LucideIcon
} from "lucide-react"

// Tournament Status Icons
export const StatusIcons = {
  live: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={`relative ${className}`} {...props}>
      <div className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75" />
      <Activity className="relative h-4 w-4 text-red-600" />
    </div>
  ),
  upcoming: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <Clock className={`h-4 w-4 text-warning-600 ${className}`} {...props} />
  ),
  completed: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <CheckCircle className={`h-4 w-4 text-success-600 ${className}`} {...props} />
  ),
  pending: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <Timer className={`h-4 w-4 text-neutral-500 ${className}`} {...props} />
  )
}

// Game Type Icons
export const GameIcons = {
  default: Gamepad2,
  fps: Target,
  sports: Trophy,
  racing: Zap,
  strategy: Crown,
  fighting: Flame,
  puzzle: Star,
  rpg: Award,
  simulation: BarChart3
}

// Player Status Icons
export const PlayerIcons = {
  online: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={`relative ${className}`} {...props}>
      <User className="h-4 w-4 text-success-600" />
      <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-success-500" />
    </div>
  ),
  offline: User,
  away: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={`relative ${className}`} {...props}>
      <User className="h-4 w-4 text-warning-600" />
      <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-warning-500" />
    </div>
  ),
  busy: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={`relative ${className}`} {...props}>
      <User className="h-4 w-4 text-error-600" />
      <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-error-500" />
    </div>
  )
}

// Action Icons
export const ActionIcons = {
  play: Play,
  pause: Pause,
  stop: X,
  refresh: RefreshCw,
  settings: Settings,
  filter: Filter,
  search: Search,
  add: Plus,
  remove: Minus,
  close: X,
  check: Check,
  external: ExternalLink,
  share: Share2,
  bookmark: Bookmark,
  heart: Heart,
  message: MessageCircle,
  bell: Bell,
  bellOff: BellOff,
  volume: Volume2,
  volumeOff: VolumeX,
  eye: Eye,
  eyeOff: EyeOff,
  edit: Settings,
  delete: X,
  save: Check,
  cancel: X,
  confirm: Check,
  back: ChevronLeft,
  forward: ChevronRight,
  up: ChevronUp,
  down: ChevronDown,
  expand: ChevronDown,
  collapse: ChevronUp
}

// Connection Status Icons
export const ConnectionIcons = {
  online: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={`flex items-center ${className}`} {...props}>
      <SignalHigh className="h-4 w-4 text-success-600" />
    </div>
  ),
  offline: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={`flex items-center ${className}`} {...props}>
      <SignalZero className="h-4 w-4 text-error-600" />
    </div>
  ),
  weak: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={`flex items-center ${className}`} {...props}>
      <SignalLow className="h-4 w-4 text-warning-600" />
    </div>
  ),
  strong: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={`flex items-center ${className}`} {...props}>
      <SignalHigh className="h-4 w-4 text-success-600" />
    </div>
  )
}

// Battery Status Icons
export const BatteryIcons = {
  full: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <Battery className={`h-4 w-4 text-success-600 ${className}`} {...props} />
  ),
  low: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <BatteryLow className={`h-4 w-4 text-warning-600 ${className}`} {...props} />
  ),
  critical: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <BatteryLow className={`h-4 w-4 text-error-600 ${className}`} {...props} />
  )
}

// Progress and Loading Icons
export const ProgressIcons = {
  loading: ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div className={`animate-spin rounded-full border-2 border-neutral-300 border-t-primary-600 h-4 w-4 ${className}`} {...props} />
  ),
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertCircle,
  info: AlertCircle
}

// Navigation Icons
export const NavigationIcons = {
  home: Trophy,
  tournaments: Trophy,
  leaderboard: TrendingUp,
  profile: User,
  settings: Settings,
  help: AlertCircle,
  about: Info,
  contact: MessageCircle,
  support: Heart,
  feedback: MessageCircle,
  community: Users,
  news: Bell,
  events: Calendar,
  schedule: Clock,
  results: BarChart3,
  stats: BarChart3,
  analytics: TrendingUp,
  reports: BarChart3
}

// Utility function to get icon by name
export const getIcon = (name: string, category: keyof typeof StatusIcons | keyof typeof GameIcons | keyof typeof ActionIcons) => {
  switch (category) {
    case 'StatusIcons':
      return StatusIcons[name as keyof typeof StatusIcons]
    case 'GameIcons':
      return GameIcons[name as keyof typeof GameIcons]
    case 'ActionIcons':
      return ActionIcons[name as keyof typeof ActionIcons]
    default:
      return Trophy
  }
}

// Default export for easy importing
const TournamentIcons = {
  StatusIcons,
  GameIcons,
  PlayerIcons,
  ActionIcons,
  ConnectionIcons,
  BatteryIcons,
  ProgressIcons,
  NavigationIcons,
  getIcon
};

export default TournamentIcons;
