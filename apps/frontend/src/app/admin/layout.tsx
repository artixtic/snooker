'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Avatar,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import WorkIcon from '@mui/icons-material/Work';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth-guard';

const drawerWidth = 240;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const { clearAllData } = await import('@/lib/logout-utils');
    await clearAllData();
    router.push('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Products', icon: <InventoryIcon />, path: '/admin/products' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/admin/inventory' },
    { text: 'Tables', icon: <TableRestaurantIcon />, path: '/admin/tables' },
    { text: 'Matches', icon: <SportsEsportsIcon />, path: '/admin/matches' },
    { text: 'Match History', icon: <ListAltIcon />, path: '/admin/match-history' },
    { text: 'Tournaments', icon: <EmojiEventsIcon />, path: '/admin/tournaments' },
    { text: 'Shifts', icon: <WorkIcon />, path: '/admin/shifts' },
    { text: 'Sales', icon: <ReceiptIcon />, path: '/admin/sales' },
    { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Activity Logs', icon: <HistoryIcon />, path: '/admin/activity-logs' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/admin/reports' },
    { text: 'Conflicts', icon: <SyncProblemIcon />, path: '/admin/conflicts' },
  ];

  return (
    <AuthGuard requireAdmin>
      <Box sx={{ display: 'flex' }}>
        <AppBar
          position="fixed"
          sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Admin Panel
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 25%, #FFA07A 50%, #FFB347 75%, #FFD700 100%)',
                  boxShadow: '0 4px 20px rgba(255, 107, 107, 0.5), 0 0 30px rgba(255, 215, 0, 0.3)',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1) rotate(5deg)',
                    boxShadow: '0 6px 30px rgba(255, 107, 107, 0.7), 0 0 40px rgba(255, 215, 0, 0.5)',
                  }
                }}
              >
                🎱
              </Avatar>
              <Typography 
                variant="h6" 
                component="div"
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  letterSpacing: 2,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 30%, #ffffff 60%, #e8eaf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 2px 4px rgba(255, 255, 255, 0.3)',
                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                  position: 'relative',
                  display: 'inline-block',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-3px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                    borderRadius: '1px',
                  },
                }}
              >
                Cue & Console
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={Link}
                    href={item.path}
                    selected={pathname === item.path}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={handleLogout}
                >
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            minHeight: '100vh',
          }}
        >
          <Toolbar />
          {children}
        </Box>
      </Box>
    </AuthGuard>
  );
}
