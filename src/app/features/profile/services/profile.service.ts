import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.js';
import { AuthService } from '../../../core/auth/auth.service.js';
import type { UpdateUserPayload, User } from '../../../core/models/user.model.js';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly API_URL = `${environment.apiUrl}/users`;

  updateProfile(userId: string, data: UpdateUserPayload): Observable<{ ok: boolean; user: User }> {
    return this.http.patch<{ ok: boolean; user: User }>(`${this.API_URL}/${userId}`, data).pipe(
      tap((res) => {
        if (res.ok && res.user) {
          this.authService.currentUser.update((curr) => {
            const updated = curr ? { ...curr, ...res.user } : res.user;
            if (typeof window !== 'undefined') {
              localStorage.setItem('saeta_user', JSON.stringify(updated));
            }
            return updated;
          });
        }
      }),
    );
  }

  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${this.API_URL}/${userId}/password`, {
      currentPassword,
      newPassword,
    });
  }

  verifyPassword(password: string, userId?: string): Observable<{ ok: boolean; msg: string }> {
    return this.http.post<{ ok: boolean; msg: string }>(`${this.API_URL}/pass`, {
      password,
      _id: userId,
    });
  }
}
