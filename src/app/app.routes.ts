import { Routes } from '@angular/router';
import { TrackListComponent } from './components/track-list/track-list.component';
import { TrackDetailComponent } from './components/track-detail/track-detail.component';

export const routes: Routes = [
    {path: 'tracks', component: TrackListComponent},
    {path: 'track-detail', component: TrackDetailComponent},
];
