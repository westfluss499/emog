/**
 * 絵文字データの保存・取得を担当するモジュール（localStorage版）
 *
 * 以前の PHP + SQLite（api/*.php, config.php）の代わりに、
 * ブラウザの localStorage にデータを保存します。
 * 初回アクセス時（データが無いとき）だけ、元の emojiList を自動で投入します。
 */
const EmojiStore = (() => {
    const STORAGE_KEY = 'emojiFactory.v1';

    const INITIAL_EMOJI_LIST = [
    ];

    function createInitialData() {
        const now = new Date().toISOString();
        const items = INITIAL_EMOJI_LIST.map((text, i) => ({
            id: i + 1,
            emoji_text: text,
            created_at: now
        }));
        return { nextId: items.length + 1, items };
    }

    function save(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            throw new Error('ブラウザへの保存に失敗しました。ストレージの容量・プライベートモードの設定を確認してください。');
        }
    }

    function load() {
        let raw;
        try {
            raw = localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            throw new Error('このブラウザではデータを保存できません（localStorageが無効です）。');
        }

        if (raw === null) {
            const initial = createInitialData();
            save(initial);
            return initial;
        }

        try {
            const data = JSON.parse(raw);
            if (!data || !Array.isArray(data.items)) throw new Error('invalid');
            return data;
        } catch (e) {
            throw new Error('保存データが壊れています。「初期状態に戻す」をお試しください。');
        }
    }

    return {
        /** 全件取得（id昇順） */
        getAll() {
            return load().items.slice().sort((a, b) => a.id - b.id);
        },

        /** 1件追加して、追加した項目を返す */
        add(text) {
            const emojiText = String(text).trim();
            if (emojiText === '') {
                throw new Error('絵文字を入力してください。');
            }
            if ([...emojiText].length > 100) {
                throw new Error('100文字以内で入力してください。');
            }
            const data = load();
            const item = {
                id: data.nextId,
                emoji_text: emojiText,
                created_at: new Date().toISOString()
            };
            data.items.push(item);
            data.nextId += 1;
            save(data);
            return item;
        },

        /** 指定IDを削除。削除できたら true、見つからなければ false */
        remove(id) {
            const data = load();
            const before = data.items.length;
            data.items = data.items.filter((e) => e.id !== id);
            if (data.items.length === before) return false;
            save(data);
            return true;
        },

        /** 初期状態（元の17個）に戻す */
        reset() {
            save(createInitialData());
        }
    };
})();
