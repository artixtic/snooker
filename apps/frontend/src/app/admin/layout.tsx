'use client';

import { useEffect, useState } from 'react';
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
  Button,
  IconButton,
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
import TableChartIcon from '@mui/icons-material/TableChart';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth-guard';
import { Chip } from '@mui/material';
import { DataTableDialog } from '@/components/data-table-dialog';

const drawerWidth = 240;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [dataTableDialogOpen, setDataTableDialogOpen] = useState(false);

  useEffect(() => {
    // Check if user is admin - role is stored as 'ADMIN' (uppercase) in database
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Debug: log the role to help troubleshoot
        console.log('User role from token:', payload.role);
        setIsAdmin(payload.role === 'ADMIN');
      } catch (error) {
        console.error('Error decoding token:', error);
        setIsAdmin(false);
      }
    }
  }, []);

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
    { text: 'Data Table', icon: <TableChartIcon />, path: '/admin/data-table' },
  ];

  return (
    <AuthGuard requireAdmin>
      <Box sx={{ display: 'flex' }}>
        <AppBar
          position="fixed"
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
          }}
        >
          <Toolbar>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                flexGrow: 1,
                fontWeight: 700,
                fontSize: '1.5rem',
                letterSpacing: 1,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              }}
            >
              Admin Panel
            </Typography>
            {isAdmin && (
              <>
                <Button
                  variant="contained"
                  startIcon={<PeopleIcon />}
                  component={Link}
                  href="/admin/users"
                  sx={{
                    mr: 2,
                    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #45a049 0%, #4CAF50 100%)',
                    },
                  }}
                >
                  Users
                </Button>
                <Button
                  variant="contained"
                  startIcon={<TableChartIcon />}
                  onClick={() => setDataTableDialogOpen(true)}
                  sx={{
                    mr: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    },
                  }}
                >
                  Data Table
                </Button>
              </>
            )}
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
              background: 'linear-gradient(180deg, #f5f7fa 0%, #c3cfe2 100%)',
              borderRight: '1px solid rgba(102, 126, 234, 0.1)',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', pt: 2 }}>
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5, px: 1 }}>
                  <ListItemButton
                    component={Link}
                    href={item.path}
                    selected={pathname === item.path}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        transform: 'translateX(4px)',
                      },
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                          transform: 'translateX(4px)',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'white',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ 
                      minWidth: 40,
                      color: pathname === item.path ? 'white' : 'inherit',
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: pathname === item.path ? 600 : 500,
                        fontSize: '0.95rem',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              <ListItem disablePadding sx={{ mt: 2, px: 1 }}>
                <ListItemButton 
                  onClick={handleLogout}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                    color: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ee5a6f 0%, #ff6b6b 100%)',
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 12px rgba(255, 107, 107, 0.4)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Logout"
                    primaryTypographyProps={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: '#f5f7fa',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          }}
        >
          <Toolbar />
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        </Box>
      </Box>
      <DataTableDialog
        open={dataTableDialogOpen}
        onClose={() => setDataTableDialogOpen(false)}
      />
    </AuthGuard>
  );
}
