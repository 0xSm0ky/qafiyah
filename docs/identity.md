# Identity

Canonical facts about Qafiyah: name, description, organization, and links. This is the single
source of truth for anyone (human or AI) referencing the project. See `README.md` for the
fuller project overview and `well-known/llms.web.md` / `well-known/llms.api.md` for the
machine-readable site indexes.

## Name

- Arabic: قافية
- English: Qafiyah
- Tagline (Arabic): مرجع الشعر العربي

## Description

**English:** Qafiyah is an open-source project dedicated to the Arabic language, making its
poetic heritage freely accessible to researchers and poetry lovers alike. We're committed to a
high-quality experience: precise search, an easy interface, and reliable texts we continuously
review and improve.

**Arabic:** قافية مشروع عربي مفتوح المصدر، يهدف إلى خدمة اللغة العربية وإتاحة تراثها الشعري
للجميع، خدمةً للباحثين ومحبّي الشعر العربي. ونحرص على أن تكون التجربة بجودة عالية: بحثٌ دقيق،
وواجهةٌ سهلة، ونصوصٌ موثوقة نعمل باستمرار على تدقيقها وتحسينها.

**Motto (Arabic, classical):** نعنى بجمع شعر العرب، فحفظه من حفظ كتاب الله، كما قال ابن عباس:
الشعر ديوان العرب، فإذا خفي علينا الحرف من القرآن، رجعنا إلى ديوانهم فالتمسناه فيه

## Organization

Qafiyah is maintained by [Raaqim](https://raaqim.org) (راقم), an open-source organization behind
several Arabic-language projects, together with its contributors.

## License

[MIT](../LICENSE)

## Links

- Website: https://qafiyah.com
- About: https://qafiyah.com/about
- API: https://api.qafiyah.com
- API docs: https://api.qafiyah.com/v1/docs
- Source code: https://github.com/raaqimorg/qafiyah
- X (Twitter): https://x.com/qafiyahx
- Telegram: https://t.me/qafiyahx
- Contact: mail@qafiyah.com
- Support (issues with the site or data): issues@qafiyah.com
- API questions: api@qafiyah.com
- Security contact: security@qafiyah.com
- Code of conduct concerns: conduct@qafiyah.com
- Dump passphrases: dumps@qafiyah.com (see `data/db/README.md`)
- Avatar snapshot passphrases: avatars@qafiyah.com (see `data/avatars/README.md`)

Code reads these URLs and addresses from the root `config.ts` (all but the dump, avatar, and conduct mailboxes, which appear only in the docs); change both together.
