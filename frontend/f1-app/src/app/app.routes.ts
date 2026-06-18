import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { F1live } from './pages/f1live/f1live';
import { Minigames } from './pages/minigames/minigames';
import { Forums } from './pages/forums/forums';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'f1live', component: F1live },
  { path: 'forums', component: Forums },
  { path: 'minigames', component: Minigames },
];
