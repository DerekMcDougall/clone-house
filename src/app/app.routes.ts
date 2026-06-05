import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/landing-page.component').then(m => m.LandingPageComponent),
    title: 'Game - Home'
  },
  {
    path: 'game',
    loadComponent: () => import('./components/gameplay.component').then(m => m.GameplayComponent),
    title: 'Game - Play'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
