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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
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
            <Typography variant="body2" sx={{ mr: 2 }}>
              Snooker POS
            </Typography>
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
                <ListItemButton onClick={handleLogout}>
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
