import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface SidebarNavigationItem {
  label: string;
  route: string;
  icon: 'dashboard' | 'listings' | 'messages' | 'showings' | 'offers' | 'documents' | 'transactions';
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.scss'
})
export class AppSidebarComponent {
  readonly primaryNavigation: SidebarNavigationItem[] = [
    {
      label: 'Dashboard',
      route: '/seller/dashboard',
      icon: 'dashboard',
      exact: true
    },
    {
      label: 'My Listings',
      route: '/seller/listings',
      icon: 'listings'
    },
    {
      label: 'Messages',
      route: '/seller/messages',
      icon: 'messages'
    },
    {
      label: 'Showings',
      route: '/seller/showings',
      icon: 'showings'
    },
    {
      label: 'Offers',
      route: '/seller/offers',
      icon: 'offers'
    },
    {
      label: 'Documents',
      route: '/seller/documents',
      icon: 'documents'
    },
    {
      label: 'Transactions',
      route: '/seller/transactions',
      icon: 'transactions'
    }
  ];

  readonly secondaryNavigation: SidebarNavigationItem[] = [
    {
      label: 'Profile',
      route: '/seller/profile',
      icon: 'dashboard'
    },
    {
      label: 'Settings',
      route: '/seller/settings',
      icon: 'documents'
    }
  ];
}