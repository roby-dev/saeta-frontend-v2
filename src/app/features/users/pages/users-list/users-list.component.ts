import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service.js';
import type { AccountStatus, CreateUserPayload, UpdateUserPayload, User, UserRole } from '../../../../core/models/user.model.js';
import { UsersService } from '../../services/users.service.js';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- ============================================================== -->
      <!-- Metric Cards (Admin Pro Style with .lstick)                   -->
      <!-- ============================================================== -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <!-- Total Usuarios -->
        <div class="bg-white p-4 rounded border border-[#e5edef] shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Usuarios</span>
            <h3 class="text-2xl font-black text-[#2b354f] mt-1">{{ usersService.totalCount() }}</h3>
          </div>
          <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>

        <!-- Administradores -->
        <div class="bg-white p-4 rounded border border-[#e5edef] shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs text-purple-600 font-semibold uppercase tracking-wider">Administradores</span>
            <h3 class="text-2xl font-black text-purple-700 mt-1">{{ usersService.adminCount() }}</h3>
          </div>
          <div class="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-base">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        <!-- Base de Seguridad -->
        <div class="bg-white p-4 rounded border border-[#e5edef] shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs text-[#009efb] font-semibold uppercase tracking-wider">Base Seguridad</span>
            <h3 class="text-2xl font-black text-[#009efb] mt-1">{{ usersService.baseCount() }}</h3>
          </div>
          <div class="w-10 h-10 rounded-full bg-sky-50 text-[#009efb] flex items-center justify-center font-bold text-base">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>

        <!-- Personal de Seguridad -->
        <div class="bg-white p-4 rounded border border-[#e5edef] shadow-sm flex items-center justify-between">
          <div>
            <span class="text-xs text-blue-600 font-semibold uppercase tracking-wider">Personal Seguridad</span>
            <h3 class="text-2xl font-black text-blue-600 mt-1">{{ usersService.personalCount() }}</h3>
          </div>
          <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <!-- Ciudadanos -->
        <div class="bg-white p-4 rounded border border-[#e5edef] shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span class="text-xs text-slate-600 font-semibold uppercase tracking-wider">Ciudadanos</span>
            <h3 class="text-2xl font-black text-slate-700 mt-1">{{ usersService.citizenCount() }}</h3>
          </div>
          <div class="w-10 h-10 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center font-bold text-base">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- Main Card Container: Header, Tabs, Filters, Table             -->
      <!-- ============================================================== -->
      <div class="bg-white rounded border border-[#e5edef] shadow-sm">
        <!-- Header with Title and Create Button -->
        <div class="p-5 border-b border-[#e5edef] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 class="card-title text-base font-bold text-[#455a64] flex items-center mb-1">
              <span class="lstick"></span>Registro de Usuarios
            </h4>
            <p class="text-xs text-slate-400">
              Total de usuarios en plataforma: <strong class="text-slate-700">{{ usersService.totalCount() }}</strong>
              (Habilitados: <span class="text-emerald-600 font-semibold">{{ usersService.enabledCount() }}</span> | Inhabilitados: <span class="text-rose-600 font-semibold">{{ usersService.disabledCount() }}</span>)
            </p>
          </div>
          <div>
            <button
              type="button"
              (click)="openCreateModal()"
              class="inline-flex items-center text-xs font-semibold bg-[#1976d2] hover:bg-[#1565c0] text-white py-2 px-4 rounded shadow-sm transition-colors cursor-pointer"
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Crear Usuario
            </button>
          </div>
        </div>

        <!-- Role Nav Tabs (Classic Admin Pro Customtab) -->
        <div class="border-b border-[#e5edef] px-5 pt-3 bg-slate-50/40">
          <ul class="flex flex-wrap gap-2 text-xs font-semibold select-none">
            @for (tab of roleTabs(); track tab.key) {
              <li>
                <button
                  type="button"
                  (click)="selectRoleTab(tab.key)"
                  class="py-2.5 px-4 border-b-2 transition-all flex items-center gap-2 cursor-pointer"
                  [ngClass]="usersService.selectedRoleTab() === tab.key 
                    ? 'border-[#1976d2] text-[#1976d2] font-bold bg-white rounded-t' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
                >
                  <span>{{ tab.label }}</span>
                  <span
                    class="text-[10px] px-1.5 py-0.5 rounded-full"
                    [ngClass]="usersService.selectedRoleTab() === tab.key 
                      ? 'bg-blue-100 text-[#1976d2]' 
                      : 'bg-slate-200 text-slate-600'"
                  >
                    {{ tab.count }}
                  </span>
                </button>
              </li>
            }
          </ul>
        </div>

        <!-- Search & Filter Controls -->
        <div class="p-5 border-b border-[#e5edef] bg-white">
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <!-- Search Input -->
            <div class="sm:col-span-8 md:col-span-7">
              <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Buscar Usuario</label>
              <div class="relative">
                <input
                  type="text"
                  [value]="usersService.searchQuery()"
                  (input)="onSearchInput($event)"
                  placeholder="Buscar por Nombres, Apellidos, DNI, Celular o Correo..."
                  class="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded focus:border-[#1976d2] focus:outline-none"
                />
                <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <!-- Status Filter -->
            <div class="sm:col-span-4 md:col-span-3">
              <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Estado de Cuenta</label>
              <select
                [value]="usersService.selectedStatusFilter()"
                (change)="onStatusFilterChange($event)"
                class="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:border-[#1976d2] focus:outline-none bg-white"
              >
                <option value="">Todos los estados</option>
                <option value="HABILITADO">Habilitado</option>
                <option value="INHABILITADO">Inhabilitado</option>
              </select>
            </div>

            <!-- Reset Button -->
            <div class="sm:col-span-12 md:col-span-2 flex items-end">
              <button
                type="button"
                (click)="resetFilters()"
                class="w-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded transition-colors cursor-pointer"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th class="py-3 px-4 w-12 text-center"></th>
                <th class="py-3 px-4">Nombres</th>
                <th class="py-3 px-4">Apellidos</th>
                <th class="py-3 px-4">DNI</th>
                <th class="py-3 px-4">Celular</th>
                <th class="py-3 px-4">Email</th>
                <th class="py-3 px-4">Rol</th>
                @if (usersService.selectedRoleTab() === 'PERSONAL_SEGURIDAD' || usersService.selectedRoleTab() === 'TODOS') {
                  <th class="py-3 px-4">Disponibilidad</th>
                }
                <th class="py-3 px-4 text-center">Estado</th>
                <th class="py-3 px-4 text-center w-36">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs text-[#555f6d]">
              @if (usersService.loading()) {
                <tr>
                  <td colspan="10" class="py-12 text-center text-slate-400">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-[#1976d2]"></div>
                    <p class="mt-2 text-xs font-semibold">Cargando usuarios...</p>
                  </td>
                </tr>
              } @else if (usersService.filteredUsers().length === 0) {
                <tr>
                  <td colspan="10" class="py-12 text-center text-slate-400">
                    No se encontraron usuarios para los filtros seleccionados.
                  </td>
                </tr>
              } @else {
                @for (user of usersService.paginatedUsers(); track user.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <!-- Avatar / Initials -->
                    <td class="py-3 px-4 text-center">
                      @if (user.image) {
                        <img
                          [src]="user.image"
                          alt="Avatar"
                          class="w-9 h-9 rounded-full object-cover border border-slate-200 mx-auto"
                        />
                      } @else {
                        <div class="w-9 h-9 rounded-full bg-[#1976d2]/10 text-[#1976d2] font-bold text-xs flex items-center justify-center mx-auto border border-blue-200">
                          {{ getUserInitials(user) }}
                        </div>
                      }
                    </td>

                    <!-- Nombres -->
                    <td class="py-3 px-4 font-bold text-[#2b354f]">
                      {{ user.name }}
                    </td>

                    <!-- Apellidos -->
                    <td class="py-3 px-4 font-semibold text-[#2b354f]">
                      {{ user.lastname }}
                    </td>

                    <!-- DNI -->
                    <td class="py-3 px-4 font-mono font-medium text-slate-600">
                      {{ user.dni || 'S/D' }}
                    </td>

                    <!-- Celular -->
                    <td class="py-3 px-4">
                      @if (user.phone) {
                        <a [href]="'tel:' + user.phone" class="text-blue-600 hover:underline font-medium">
                          {{ user.phone }}
                        </a>
                      } @else {
                        <span class="text-slate-400">-</span>
                      }
                    </td>

                    <!-- Email -->
                    <td class="py-3 px-4 text-slate-600">
                      {{ user.email }}
                    </td>

                    <!-- Rol -->
                    <td class="py-3 px-4">
                      <span
                        class="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold"
                        [ngClass]="getRoleBadgeClass(user.role)"
                      >
                        {{ getRoleLabel(user.role) }}
                      </span>
                    </td>

                    <!-- Disponibilidad (if personal or visible) -->
                    @if (usersService.selectedRoleTab() === 'PERSONAL_SEGURIDAD' || usersService.selectedRoleTab() === 'TODOS') {
                      <td class="py-3 px-4">
                        @if (user.role === 'PERSONAL_SEGURIDAD') {
                          <span
                            class="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                            [ngClass]="getAvailabilityBadgeClass(user.availability)"
                          >
                            {{ user.availability || 'DISPONIBLE' }}
                          </span>
                        } @else {
                          <span class="text-slate-300">-</span>
                        }
                      </td>
                    }

                    <!-- Estado (Habilitado / Inhabilitado) -->
                    <td class="py-3 px-4 text-center">
                      <span
                        class="inline-block px-2.5 py-1 rounded text-[11px] font-bold"
                        [ngClass]="getStatusBadgeClass(user.statusAccount)"
                      >
                        {{ user.statusAccount === 'INHABILITADO' ? 'Inhabilitado' : 'Habilitado' }}
                      </span>
                    </td>

                    <!-- Acciones -->
                    <td class="py-3 px-4 text-center">
                      <div class="flex items-center justify-center gap-1.5">
                        <!-- Edit Button -->
                        <button
                          type="button"
                          (click)="openEditModal(user)"
                          class="p-1.5 rounded text-[#1976d2] hover:bg-blue-50 transition-colors border border-blue-200 cursor-pointer"
                          title="Editar usuario"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>

                        <!-- Toggle Status Button (unless it's self) -->
                        @if (!isSelf(user)) {
                          @if (user.statusAccount !== 'INHABILITADO') {
                            <button
                              type="button"
                              (click)="toggleStatus(user)"
                              class="p-1.5 rounded text-rose-600 hover:bg-rose-50 transition-colors border border-rose-200 cursor-pointer"
                              title="Inhabilitar cuenta"
                            >
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          } @else {
                            <button
                              type="button"
                              (click)="toggleStatus(user)"
                              class="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 transition-colors border border-emerald-200 cursor-pointer"
                              title="Habilitar cuenta"
                            >
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          }
                        }

                        <!-- Password Reset Button -->
                        <button
                          type="button"
                          (click)="openPasswordModal(user)"
                          class="p-1.5 rounded text-amber-600 hover:bg-amber-50 transition-colors border border-amber-200 cursor-pointer"
                          title="Reestablecer contraseña"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div class="p-4 border-t border-[#e5edef] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
          <div>
            Mostrando {{ usersService.paginatedUsers().length }} de {{ usersService.filteredTotal() }} usuarios filtrados
            (Página {{ usersService.currentPage() }} de {{ usersService.totalPages() }})
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              (click)="usersService.prevPage()"
              [disabled]="usersService.currentPage() <= 1"
              class="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Anterior
            </button>
            <span class="px-2 font-bold text-slate-700">
              {{ usersService.currentPage() }}
            </span>
            <button
              type="button"
              (click)="usersService.nextPage()"
              [disabled]="usersService.currentPage() >= usersService.totalPages()"
              class="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- Create / Edit User Modal                                       -->
      <!-- ============================================================== -->
      @if (isUserModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div class="bg-white rounded-lg max-w-lg w-full overflow-hidden shadow-2xl animate-fade-in border border-slate-200">
            <!-- Modal Header -->
            <div class="bg-[#1976d2] px-6 py-4 text-white flex items-center justify-between">
              <h5 class="text-base font-bold">
                {{ isEditMode() ? 'Actualizar Usuario' : 'Crear Nuevo Usuario' }}
              </h5>
              <button
                type="button"
                (click)="closeUserModal()"
                class="text-white hover:text-rose-200 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <!-- Modal Form -->
            <form [formGroup]="userForm" (ngSubmit)="submitUserForm()" class="p-6 space-y-4 text-xs text-slate-600 max-h-[80vh] overflow-y-auto">
              @if (modalError()) {
                <div class="p-3 bg-rose-50 text-rose-700 rounded border border-rose-200 text-xs">
                  {{ modalError() }}
                </div>
              }

              <!-- Documento de Identidad (DNI) -->
              <div>
                <label class="block font-bold text-slate-700 mb-1">
                  Documento de Identidad (DNI) <span class="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  formControlName="dni"
                  maxlength="8"
                  placeholder="8 dígitos numéricos"
                  class="w-full p-2 border rounded focus:border-[#1976d2] focus:outline-none"
                  [ngClass]="isFieldInvalid('dni') ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
                />
                @if (isFieldInvalid('dni')) {
                  <p class="text-rose-600 text-[11px] mt-0.5">El DNI debe tener exactamente 8 dígitos.</p>
                }
              </div>

              <!-- Nombres & Apellidos Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">
                    Nombres <span class="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    formControlName="name"
                    placeholder="Ej. Juan Carlos"
                    class="w-full p-2 border rounded focus:border-[#1976d2] focus:outline-none"
                    [ngClass]="isFieldInvalid('name') ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
                  />
                  @if (isFieldInvalid('name')) {
                    <p class="text-rose-600 text-[11px] mt-0.5">Los nombres son requeridos.</p>
                  }
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">
                    Apellidos <span class="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    formControlName="lastname"
                    placeholder="Ej. Perez Gomez"
                    class="w-full p-2 border rounded focus:border-[#1976d2] focus:outline-none"
                    [ngClass]="isFieldInvalid('lastname') ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
                  />
                  @if (isFieldInvalid('lastname')) {
                    <p class="text-rose-600 text-[11px] mt-0.5">Los apellidos son requeridos.</p>
                  }
                </div>
              </div>

              <!-- Email & Phone Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">
                    Correo Electrónico <span class="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    formControlName="email"
                    placeholder="correo@ejemplo.com"
                    class="w-full p-2 border rounded focus:border-[#1976d2] focus:outline-none"
                    [ngClass]="isFieldInvalid('email') ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
                  />
                  @if (isFieldInvalid('email')) {
                    <p class="text-rose-600 text-[11px] mt-0.5">Ingrese un correo electrónico válido.</p>
                  }
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">
                    Nro. de Celular <span class="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    formControlName="phone"
                    maxlength="9"
                    placeholder="9 dígitos numéricos"
                    class="w-full p-2 border rounded focus:border-[#1976d2] focus:outline-none"
                    [ngClass]="isFieldInvalid('phone') ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
                  />
                  @if (isFieldInvalid('phone')) {
                    <p class="text-rose-600 text-[11px] mt-0.5">El celular debe tener 9 dígitos.</p>
                  }
                </div>
              </div>

              <!-- Role & Estado Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">
                    Rol en Plataforma <span class="text-rose-500">*</span>
                  </label>
                  <select
                    formControlName="role"
                    class="w-full p-2 border border-slate-300 rounded focus:border-[#1976d2] focus:outline-none bg-white"
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="BASE_SEGURIDAD">Base de Seguridad</option>
                    <option value="PERSONAL_SEGURIDAD">Personal de Seguridad</option>
                    <option value="CIUDADANO">Ciudadano</option>
                  </select>
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">
                    Estado de la Cuenta <span class="text-rose-500">*</span>
                  </label>
                  <select
                    formControlName="statusAccount"
                    class="w-full p-2 border border-slate-300 rounded focus:border-[#1976d2] focus:outline-none bg-white"
                  >
                    <option value="HABILITADO">Habilitado</option>
                    <option value="INHABILITADO">Inhabilitado</option>
                  </select>
                </div>
              </div>

              <!-- Password field (Required on Create mode) -->
              @if (!isEditMode()) {
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="font-bold text-slate-700">
                      Contraseña de Acceso <span class="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      (click)="generateRandomPassword()"
                      class="text-[11px] text-[#1976d2] hover:underline font-semibold cursor-pointer"
                    >
                      Generar aleatoria
                    </button>
                  </div>
                  <input
                    type="text"
                    formControlName="password"
                    placeholder="Mínimo 6 caracteres"
                    class="w-full p-2 border rounded focus:border-[#1976d2] focus:outline-none font-mono"
                    [ngClass]="isFieldInvalid('password') ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'"
                  />
                  @if (isFieldInvalid('password')) {
                    <p class="text-rose-600 text-[11px] mt-0.5">La contraseña debe tener al menos 6 caracteres.</p>
                  }
                </div>
              }

              <!-- Modal Footer Buttons -->
              <div class="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  (click)="closeUserModal()"
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="modalLoading() || userForm.invalid"
                  class="px-5 py-2 bg-[#1976d2] hover:bg-[#1565c0] text-white font-semibold rounded text-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  @if (modalLoading()) {
                    <div class="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                    <span>Guardando...</span>
                  } @else {
                    <span>{{ isEditMode() ? 'Actualizar Usuario' : 'Guardar Usuario' }}</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ============================================================== -->
      <!-- Password Reset Modal                                           -->
      <!-- ============================================================== -->
      @if (isPasswordModalOpen() && passwordTargetUser()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div class="bg-white rounded-lg max-w-md w-full overflow-hidden shadow-2xl animate-fade-in border border-slate-200">
            <!-- Modal Header -->
            <div class="bg-amber-600 px-6 py-4 text-white flex items-center justify-between">
              <h5 class="text-base font-bold flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Reestablecer Contraseña
              </h5>
              <button
                type="button"
                (click)="closePasswordModal()"
                class="text-white hover:text-amber-200 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <!-- Modal Content -->
            <div class="p-6 space-y-4 text-xs text-slate-600">
              <div class="p-3 bg-amber-50 rounded border border-amber-200">
                <p class="font-bold text-slate-800">
                  {{ passwordTargetUser()!.name }} {{ passwordTargetUser()!.lastname }}
                </p>
                <p class="text-slate-500">
                  DNI: {{ passwordTargetUser()!.dni }} | Email: {{ passwordTargetUser()!.email }}
                </p>
              </div>

              @if (passwordSuccessMessage()) {
                <div class="p-3 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                  <p class="font-bold">¡Contraseña actualizada exitosamente!</p>
                  <p class="mt-1">
                    Nueva contraseña asignada: <strong class="font-mono text-sm bg-white px-2 py-0.5 rounded border border-emerald-300">{{ newPasswordValue() }}</strong>
                  </p>
                </div>
              } @else {
                @if (passwordError()) {
                  <div class="p-3 bg-rose-50 text-rose-700 rounded border border-rose-200">
                    {{ passwordError() }}
                  </div>
                }

                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="font-bold text-slate-700">Nueva Contraseña</label>
                    <button
                      type="button"
                      (click)="generatePasswordForReset()"
                      class="text-[11px] text-[#1976d2] hover:underline font-semibold cursor-pointer"
                    >
                      Generar aleatoria
                    </button>
                  </div>
                  <input
                    type="text"
                    [value]="newPasswordValue()"
                    (input)="onPasswordInput($event)"
                    placeholder="Mínimo 6 caracteres"
                    class="w-full p-2 border border-slate-300 rounded focus:border-amber-600 focus:outline-none font-mono text-xs"
                  />
                </div>
              }

              <!-- Footer Buttons -->
              <div class="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  (click)="closePasswordModal()"
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs cursor-pointer"
                >
                  {{ passwordSuccessMessage() ? 'Cerrar' : 'Cancelar' }}
                </button>

                @if (!passwordSuccessMessage()) {
                  <button
                    type="button"
                    (click)="submitPasswordReset()"
                    [disabled]="isResettingPassword() || newPasswordValue().length < 6"
                    class="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    @if (isResettingPassword()) {
                      <div class="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span>Actualizando...</span>
                    } @else {
                      <span>Actualizar Clave</span>
                    }
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class UsersListComponent implements OnInit {
  protected readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  // Tabs definitions
  protected readonly roleTabs = computed(() => [
    { key: 'TODOS', label: 'Todos', count: this.usersService.totalCount() },
    { key: 'ADMIN', label: 'Administrador', count: this.usersService.adminCount() },
    { key: 'BASE_SEGURIDAD', label: 'Base', count: this.usersService.baseCount() },
    { key: 'PERSONAL_SEGURIDAD', label: 'Personal', count: this.usersService.personalCount() },
    { key: 'CIUDADANO', label: 'Ciudadano', count: this.usersService.citizenCount() },
  ]);

  // Modal State
  protected readonly isUserModalOpen = signal<boolean>(false);
  protected readonly isEditMode = signal<boolean>(false);
  protected readonly modalLoading = signal<boolean>(false);
  protected readonly modalError = signal<string | null>(null);
  protected editingUserId: string | null = null;

  // Password Modal State
  protected readonly isPasswordModalOpen = signal<boolean>(false);
  protected readonly passwordTargetUser = signal<User | null>(null);
  protected readonly newPasswordValue = signal<string>('');
  protected readonly passwordSuccessMessage = signal<string | null>(null);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly isResettingPassword = signal<boolean>(false);

  // User Form
  protected userForm: FormGroup = this.initUserForm();

  ngOnInit(): void {
    this.usersService.loadUsers().subscribe();
  }

  private initUserForm(): FormGroup {
    return this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      name: ['', [Validators.required, Validators.maxLength(50)]],
      lastname: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      role: ['PERSONAL_SEGURIDAD' as UserRole, Validators.required],
      statusAccount: ['HABILITADO' as AccountStatus, Validators.required],
      password: [''],
    });
  }

  selectRoleTab(role: string): void {
    this.usersService.setRoleTab(role);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.usersService.setSearchQuery(input.value);
  }

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.usersService.setStatusFilter(select.value);
  }

  resetFilters(): void {
    this.usersService.setSearchQuery('');
    this.usersService.setStatusFilter('');
    this.usersService.setRoleTab('TODOS');
  }

  isSelf(user: User): boolean {
    const current = this.authService.currentUser();
    return !!current && current.id === user.id;
  }

  getUserInitials(user: User): string {
    const first = user.name?.charAt(0) ?? '';
    const last = user.lastname?.charAt(0) ?? '';
    return `${first}${last}`.toUpperCase() || 'U';
  }

  getRoleBadgeClass(role: UserRole): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'BASE_SEGURIDAD':
        return 'bg-sky-100 text-sky-800 border border-sky-200';
      case 'PERSONAL_SEGURIDAD':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'CIUDADANO':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'BASE_SEGURIDAD':
        return 'Base de Seguridad';
      case 'PERSONAL_SEGURIDAD':
        return 'Personal Seguridad';
      case 'CIUDADANO':
        return 'Ciudadano';
      default:
        return role;
    }
  }

  getAvailabilityBadgeClass(availability?: string): string {
    if (availability === 'OCUPADO') {
      return 'bg-rose-100 text-rose-800 border border-rose-200';
    }
    return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  }

  getStatusBadgeClass(status?: AccountStatus): string {
    if (status === 'INHABILITADO') {
      return 'bg-rose-100 text-rose-800 border border-rose-200';
    }
    return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  // =========================================================================
  // User Create / Edit Modal Logic
  // =========================================================================

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingUserId = null;
    this.modalError.set(null);
    this.modalLoading.set(false);

    this.userForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      name: ['', [Validators.required, Validators.maxLength(50)]],
      lastname: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      role: ['PERSONAL_SEGURIDAD' as UserRole, Validators.required],
      statusAccount: ['HABILITADO' as AccountStatus, Validators.required],
      password: [this.generateRandomString(), [Validators.required, Validators.minLength(6)]],
    });

    this.isUserModalOpen.set(true);
  }

  openEditModal(user: User): void {
    this.isEditMode.set(true);
    this.editingUserId = user.id;
    this.modalError.set(null);
    this.modalLoading.set(false);

    this.userForm = this.fb.group({
      dni: [user.dni, [Validators.required, Validators.pattern(/^\d{8}$/)]],
      name: [user.name, [Validators.required, Validators.maxLength(50)]],
      lastname: [user.lastname, [Validators.required, Validators.maxLength(50)]],
      email: [user.email, [Validators.required, Validators.email]],
      phone: [user.phone, [Validators.required, Validators.pattern(/^\d{9}$/)]],
      role: [user.role, Validators.required],
      statusAccount: [user.statusAccount ?? 'HABILITADO', Validators.required],
      password: [''],
    });

    this.isUserModalOpen.set(true);
  }

  closeUserModal(): void {
    this.isUserModalOpen.set(false);
    this.editingUserId = null;
    this.modalError.set(null);
  }

  generateRandomPassword(): void {
    this.userForm.patchValue({ password: this.generateRandomString() });
  }

  private generateRandomString(): string {
    return Math.random().toString(36).slice(-8);
  }

  submitUserForm(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.modalLoading.set(true);
    this.modalError.set(null);

    const values = this.userForm.getRawValue();

    if (this.isEditMode() && this.editingUserId) {
      const updatePayload: UpdateUserPayload = {
        name: values.name,
        lastname: values.lastname,
        phone: values.phone,
        email: values.email,
        statusAccount: values.statusAccount,
      };

      this.usersService.updateUser(this.editingUserId, updatePayload).subscribe({
        next: () => {
          this.modalLoading.set(false);
          this.closeUserModal();
        },
        error: (err) => {
          this.modalLoading.set(false);
          this.modalError.set(err?.error?.message || err?.error?.msg || 'Error al actualizar usuario');
        },
      });
    } else {
      const createPayload: CreateUserPayload = {
        dni: values.dni,
        name: values.name,
        lastname: values.lastname,
        email: values.email,
        phone: values.phone,
        role: values.role,
        password: values.password,
      };

      this.usersService.createUser(createPayload).subscribe({
        next: () => {
          this.modalLoading.set(false);
          this.closeUserModal();
        },
        error: (err) => {
          this.modalLoading.set(false);
          this.modalError.set(err?.error?.message || err?.error?.msg || 'Error al crear usuario');
        },
      });
    }
  }

  toggleStatus(user: User): void {
    const action = user.statusAccount === 'INHABILITADO' ? 'habilitar' : 'inhabilitar';
    if (typeof window !== 'undefined' && confirm(`¿Está seguro que desea ${action} la cuenta de ${user.name} ${user.lastname}?`)) {
      this.usersService.toggleUserStatus(user).subscribe({
        error: (err) => {
          alert(err?.error?.message || err?.error?.msg || `No se pudo ${action} al usuario`);
        },
      });
    }
  }

  // =========================================================================
  // Password Reset Modal Logic
  // =========================================================================

  openPasswordModal(user: User): void {
    this.passwordTargetUser.set(user);
    this.newPasswordValue.set(this.generateRandomString());
    this.passwordSuccessMessage.set(null);
    this.passwordError.set(null);
    this.isResettingPassword.set(false);
    this.isPasswordModalOpen.set(true);
  }

  closePasswordModal(): void {
    this.isPasswordModalOpen.set(false);
    this.passwordTargetUser.set(null);
  }

  onPasswordInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newPasswordValue.set(input.value);
  }

  generatePasswordForReset(): void {
    this.newPasswordValue.set(this.generateRandomString());
  }

  submitPasswordReset(): void {
    const user = this.passwordTargetUser();
    const newPass = this.newPasswordValue().trim();
    if (!user || newPass.length < 6) return;

    this.isResettingPassword.set(true);
    this.passwordError.set(null);

    this.usersService.changePassword(user.id, newPass).subscribe({
      next: () => {
        this.isResettingPassword.set(false);
        this.passwordSuccessMessage.set('Contraseña actualizada correctamente');
      },
      error: (err) => {
        this.isResettingPassword.set(false);
        this.passwordError.set(err?.error?.message || err?.error?.msg || 'Error al cambiar contraseña');
      },
    });
  }
}
