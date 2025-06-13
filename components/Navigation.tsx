'use client';

import { Fragment, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, HomeIcon, ChartBarIcon, BookOpenIcon, UserIcon, ArrowRightOnRectangleIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useAuth } from './AuthProvider';
import { signOutUser as signOut } from '../lib/auth';

export default function Navigation() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  
  // モバイルデバイスの検出
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkIsMobile = () => {
        return window.innerWidth < 640;
      };
      
      setIsMobile(checkIsMobile());
      
      const handleResize = () => {
        setIsMobile(checkIsMobile());
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // ナビゲーション項目
  const navigation = [
    { name: 'ホーム', href: '/', current: pathname === '/', icon: HomeIcon },
    { name: '対戦記録', href: '/duels', current: pathname === '/duels' || pathname.startsWith('/duels/'), icon: BookOpenIcon },
    { name: '統計', href: '/stats', current: pathname === '/stats', icon: ChartBarIcon },
    { name: 'イベント管理', href: '/events', current: pathname === '/events' || pathname.startsWith('/events/'), icon: CalendarIcon },
    { name: 'デッキ管理', href: '/decks', current: pathname === '/decks' || pathname.startsWith('/decks/'), icon: UserIcon },
  ];

  // 認証済みユーザーのみに表示するナビゲーション
  const authenticatedNavigation = user ? navigation : navigation.filter(item => item.href === '/');

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <>
      <Disclosure as="nav" className="bg-purple-900 shadow-md">
        {({ open, close }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-16 sm:h-18 items-center justify-between">
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                  {/* モバイルメニューボタン */}
                  <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-purple-200 hover:bg-purple-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">メニューを開く</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
                
                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="flex flex-shrink-0 items-center pl-2 sm:pl-0">
                    <Link href="/" className="block hover:opacity-90 transition-opacity">
                      <Image
                        src="/stats-logo.png"
                        alt="Master Duel Stats"
                        width={isMobile ? 180 : 220}
                        height={isMobile ? 40 : 50}
                        className="h-9 sm:h-11 w-auto drop-shadow-md"
                        priority
                      />
                    </Link>
                  </div>
                  <div className="hidden sm:ml-8 sm:block">
                    <div className="flex space-x-4">
                      {authenticatedNavigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            item.current
                              ? 'bg-purple-800 text-white'
                              : 'text-purple-200 hover:bg-purple-700 hover:text-white',
                            'rounded-md px-3 py-2 text-sm font-medium flex items-center'
                          )}
                          aria-current={item.current ? 'page' : undefined}
                        >
                          <item.icon className="h-5 w-5 mr-1.5" aria-hidden="true" />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  {/* プロフィールドロップダウン */}
                  {user ? (
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <Menu.Button className="relative flex rounded-full bg-purple-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-800">
                          <span className="absolute -inset-1.5" />
                          <span className="sr-only">ユーザーメニュー</span>
                          <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                            {user.displayName?.charAt(0) || 'U'}
                          </div>
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                href="/profile"
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700 flex items-center'
                                )}
                              >
                                <UserIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                プロフィール
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={handleSignOut}
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center'
                                )}
                              >
                                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                                ログアウト
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : (
                    <div className="flex space-x-2">
                      <Link
                        href="/login"
                        className="text-purple-200 hover:bg-purple-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
                      >
                        ログイン
                      </Link>
                      <Link
                        href="/signup"
                        className="bg-purple-600 text-white hover:bg-purple-500 rounded-md px-3 py-2 text-sm font-medium"
                      >
                        登録
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2">
                {authenticatedNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => close()}
                    className={classNames(
                      item.current
                        ? 'bg-purple-800 text-white'
                        : 'text-purple-200 hover:bg-purple-700 hover:text-white',
                      'flex items-center rounded-md px-3 py-3 text-base font-medium'
                    )}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    <item.icon className="h-6 w-6 mr-3" aria-hidden="true" />
                    {item.name}
                  </Link>
                ))}
                
                {user && (
                  <div className="border-t border-purple-700 mt-2 pt-2">
                    <Link
                      href="/profile"
                      onClick={() => close()}
                      className="flex items-center text-purple-200 hover:bg-purple-700 hover:text-white rounded-md px-3 py-3 text-base font-medium"
                    >
                      <UserIcon className="h-6 w-6 mr-3" aria-hidden="true" />
                      プロフィール
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        close();
                      }}
                      className="flex w-full items-center text-purple-200 hover:bg-purple-700 hover:text-white rounded-md px-3 py-3 text-base font-medium"
                    >
                      <ArrowRightOnRectangleIcon className="h-6 w-6 mr-3" aria-hidden="true" />
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      
      {/* モバイル用の下部タブナビゲーション */}
      {isMobile && user && (
        <div className="fixed bottom-0 left-0 right-0 bg-purple-900 border-t border-purple-800 z-10">
          <div className="grid grid-cols-4 h-16">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  item.current
                    ? 'text-white bg-purple-800'
                    : 'text-purple-300 hover:bg-purple-800 hover:text-white',
                  'flex flex-col items-center justify-center text-xs font-medium pt-2'
                )}
              >
                <item.icon
                  className={classNames(
                    item.current ? 'text-white' : 'text-purple-300',
                    'h-6 w-6 mb-1'
                  )}
                  aria-hidden="true"
                />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      {/* モバイル用の下部ナビゲーションのスペーサー */}
      {isMobile && user && <div className="h-16"></div>}
    </>
  );
} 