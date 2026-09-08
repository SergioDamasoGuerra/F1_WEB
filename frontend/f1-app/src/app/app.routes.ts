import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Standings } from './pages/standings/standings';
import { Minigames } from './pages/minigames/minigames';
import { Forums } from './pages/forums/forums';
import { Schedule } from './pages/schedule/schedule';
import { Login } from './pages/login/login';
import { yearResolver } from './resolvers/year.resolver'

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: 'standings',
    children: [
      {
        path: '',
        component: Standings,
        resolve: { year: yearResolver },
      },
      {
        path: ':year',
        component: Standings,
        resolve: { year: yearResolver },
      },
    ],
  },
  {
    path: 'schedule',
    children: [
      {
        path: '',
        component: Schedule,
        resolve: { year: yearResolver },
      },
      {
        path: ':year',
        component: Schedule,
        resolve: { year: yearResolver },
      },
    ],
  },
  { path: 'forums', component: Forums },
  { path: 'minigames', component: Minigames },
  { path: 'login', component: Login },
];
