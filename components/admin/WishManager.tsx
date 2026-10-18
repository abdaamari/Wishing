'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Wish } from '@/lib/types';

type WishFilter = 'all' | 'published' | 'hidden';
type WishEdit = Pick<Wish, 'name' | 'message' | 'color'>;

const colors: Wish['color'][] = ['sky', 'butter', 'peach', 'mint', 'lavender'];
const PAGE_SIZE = 100;
const colorClasses: Record<Wish['color'], string> = {
  sky: 'bg-sky-100',
  butter: 'bg-amber-100',
  peach: 'bg-orange-100',
  mint: 'bg-emerald-100',
  lavender: 'bg-violet-100',
};

export default function WishManager() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<WishFilter>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<WishEdit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;

    void fetch(`/api/admin/wishes?offset=${page * PAGE_SIZE}`)
      .then(async (response) => {
        const result: { wishes?: Wish[]; total?: number; error?: string } =
          await response.json();
        if (!response.ok || !result.wishes) {
          throw new Error(result.error ?? 'Unable to load wishes.');
        }
        return { wishes: result.wishes, total: result.total ?? result.wishes.length };
      })
      .then((result) => {
        if (!cancelled) {
          setWishes(result.wishes);
          setTotal(result.total);
        }
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        console.error('Loading admin wishes failed:', requestError);
        setError(
          requestError instanceof Error ? requestError.message : 'Unable to load wishes.',
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  const visibleWishes = useMemo(
    () =>
      wishes.filter((wish) => {
        const matchesFilter = filter === 'all' || wish.status === filter;
        const query = search.trim().toLocaleLowerCase();
        const matchesSearch =
          !query ||
          wish.name.toLocaleLowerCase().includes(query) ||
          wish.message.toLocaleLowerCase().includes(query);
        return matchesFilter && matchesSearch;
      }),
    [filter, search, wishes],
  );

  async function updateWish(
    id: string,
    method: 'PATCH' | 'POST' | 'DELETE',
    body?: object,
  ) {
    setBusyId(id);
    setError('');
    setNotice('');

    try {
      const response = await fetch(`/api/admin/wishes/${encodeURIComponent(id)}`, {
        method,
        ...(body
          ? {
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            }
          : {}),
      });
      const result: { wish?: Wish; error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Unable to update this wish.');

      if (method === 'DELETE') {
        setWishes((current) => current.filter((wish) => wish.id !== id));
        setTotal((current) => Math.max(0, current - 1));
        setNotice('Wish deleted.');
        if (page > 0 && wishes.length === 1) {
          setIsLoading(true);
          setPage((current) => current - 1);
        }
      } else if (result.wish) {
        setWishes((current) =>
          current.map((wish) => (wish.id === id ? result.wish! : wish)),
        );
        setNotice(method === 'PATCH' ? 'Wish updated.' : 'Wish visibility updated.');
      }

      setEditingId(null);
      setEdit(null);
    } catch (requestError) {
      console.error('Updating admin wish failed:', requestError);
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to update this wish.',
      );
    } finally {
      setBusyId(null);
    }
  }

  function startEditing(wish: Wish) {
    setEditingId(wish.id);
    setEdit({ name: wish.name, message: wish.message, color: wish.color });
    setError('');
    setNotice('');
  }

  function saveEdit(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    if (!edit) return;
    void updateWish(id, 'PATCH', edit);
  }

  return (
    <section className="mt-12" aria-labelledby="wish-manager-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#527C85]">
            Community
          </p>
          <h2 id="wish-manager-title" className="mt-2 font-serif text-3xl">
            Manage wishes
          </h2>
          <p className="mt-2 text-sm text-[#687D8C]">
            Search, edit, hide, publish, or delete wishes.
          </p>
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#426C78] shadow-sm">
          {total} wishes
        </span>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="wish-search">
          Search wishes
        </label>
        <input
          className="min-w-0 flex-1 rounded-xl border border-[#D8E0DF] bg-white px-4 py-3 text-sm outline-none focus:border-[#527C85] focus:ring-2 focus:ring-[#527C85]/15"
          id="wish-search"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search this page by name or message"
          value={search}
        />
        <div className="flex rounded-xl border border-[#D8E0DF] bg-white p-1">
          {(['all', 'published', 'hidden'] as const).map((value) => (
            <button
              aria-pressed={filter === value}
              className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${
                filter === value ? 'bg-[#294C58] text-white' : 'text-[#52717A] hover:bg-[#F1F6F4]'
              }`}
              key={value}
              onClick={() => setFilter(value)}
              type="button"
            >
              {value === 'all' ? 'All' : value}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      {total > PAGE_SIZE && (
        <nav
          aria-label="Wish pages"
          className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3"
        >
          <button
            className="rounded-full border border-[#C9D7D6] px-4 py-2 text-sm text-[#426C78] disabled:opacity-40"
            disabled={page === 0 || isLoading}
            onClick={() => {
              setIsLoading(true);
              setPage((current) => Math.max(0, current - 1));
            }}
            type="button"
          >
            Previous
          </button>
          <span className="text-sm text-[#687D8C]">
            Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}
          </span>
          <button
            className="rounded-full border border-[#C9D7D6] px-4 py-2 text-sm text-[#426C78] disabled:opacity-40"
            disabled={(page + 1) * PAGE_SIZE >= total || isLoading}
            onClick={() => {
              setIsLoading(true);
              setPage((current) => current + 1);
            }}
            type="button"
          >
            Next
          </button>
        </nav>
      )}
      {notice && (
        <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          {notice}
        </p>
      )}

      {isLoading ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#687D8C]">
          Loading wishes…
        </p>
      ) : visibleWishes.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#687D8C]">
          No wishes match this filter.
        </p>
      ) : (
        <div className="space-y-4">
          {visibleWishes.map((wish) => {
            const isEditing = editingId === wish.id && edit;
            const isBusy = busyId === wish.id;

            return (
              <article
                className="overflow-hidden rounded-2xl border border-white bg-white shadow-sm"
                key={wish.id}
              >
                {isEditing ? (
                  <form
                    className="space-y-4 p-5"
                    onSubmit={(event) => saveEdit(event, wish.id)}
                  >
                    <label className="block text-sm font-medium text-[#426C78]">
                      Name
                      <input
                        className="mt-1 w-full rounded-xl border border-[#D8E0DF] px-3 py-2 text-[#26343A] outline-none focus:border-[#527C85]"
                        maxLength={40}
                        onChange={(event) =>
                          setEdit((current) =>
                            current ? { ...current, name: event.target.value } : current,
                          )
                        }
                        required
                        value={edit.name}
                      />
                    </label>
                    <label className="block text-sm font-medium text-[#426C78]">
                      Wish message
                      <textarea
                        className="mt-1 w-full resize-y rounded-xl border border-[#D8E0DF] px-3 py-2 text-[#26343A] outline-none focus:border-[#527C85]"
                        maxLength={280}
                        onChange={(event) =>
                          setEdit((current) =>
                            current ? { ...current, message: event.target.value } : current,
                          )
                        }
                        required
                        rows={3}
                        value={edit.message}
                      />
                    </label>
                    <fieldset>
                      <legend className="mb-2 text-sm font-medium text-[#426C78]">
                        Card color
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {colors.map((color) => (
                          <button
                            aria-label={color}
                            aria-pressed={edit.color === color}
                            className={`h-8 w-8 rounded-full ${colorClasses[color]} ${
                              edit.color === color ? 'ring-2 ring-[#294C58] ring-offset-2' : ''
                            }`}
                            key={color}
                            onClick={() =>
                              setEdit((current) => (current ? { ...current, color } : current))
                            }
                            type="button"
                          />
                        ))}
                      </div>
                    </fieldset>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-full bg-[#294C58] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                        disabled={isBusy}
                        type="submit"
                      >
                        {isBusy ? 'Saving…' : 'Save edit'}
                      </button>
                      <button
                        className="rounded-full border border-[#C9D7D6] px-4 py-2 text-sm text-[#426C78]"
                        onClick={() => {
                          setEditingId(null);
                          setEdit(null);
                        }}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                    {wish.photo_url && (
                      <img
                        alt={`Wish photo from ${wish.name}`}
                        className="h-32 w-full rounded-xl object-cover sm:w-32"
                        src={wish.photo_url}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                            wish.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {wish.status}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs capitalize text-[#426C78] ${
                            colorClasses[wish.color as Wish['color']] ?? 'bg-gray-100'
                          }`}
                        >
                          {wish.color}
                        </span>
                        <span className="text-xs text-[#809195]">
                          {new Date(wish.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="break-words font-serif text-lg text-[#294C58]">
                        {wish.message}
                      </p>
                      <p className="mt-1 text-sm text-[#687D8C]">— {wish.name}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-[#C9D7D6] px-3 py-1.5 text-xs font-medium text-[#426C78] hover:bg-[#F1F6F4]"
                          onClick={() => startEditing(wish)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-full border border-[#C9D7D6] px-3 py-1.5 text-xs font-medium text-[#426C78] hover:bg-[#F1F6F4] disabled:opacity-60"
                          disabled={isBusy}
                          onClick={() =>
                            void updateWish(wish.id, 'POST', {
                              status: wish.status === 'published' ? 'hidden' : 'published',
                            })
                          }
                          type="button"
                        >
                          {isBusy
                            ? 'Updating…'
                            : wish.status === 'published'
                              ? 'Hide'
                              : 'Publish'}
                        </button>
                        <button
                          className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                          disabled={isBusy}
                          onClick={() => {
                            if (window.confirm('Delete this wish and its photo permanently?')) {
                              void updateWish(wish.id, 'DELETE');
                            }
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
