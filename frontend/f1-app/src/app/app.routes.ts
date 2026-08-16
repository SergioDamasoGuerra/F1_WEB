import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Standings } from './pages/standings/standings';
import { Minigames } from './pages/minigames/minigames';
import { Forums } from './pages/forums/forums';
import { Schedule } from './pages/schedule/schedule';
import { Login } from './pages/login/login';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'standings', component: Standings },
  { path: 'schedule', component: Schedule },
  { path: 'forums', component: Forums },
  { path: 'minigames', component: Minigames },
  { path: 'login', component: Login },
];
