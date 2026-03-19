"use client";

import { useState } from "react";

type Item = {
  id: string;
  question: string;
  answer: string;
};

type Props = {
  items: Item[];
};

export default function HomepageFaq({ items }: Props) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="faq-stack">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id} className={`faq-item ${open ? "open" : ""}`}>
            <button
              type="button"
              className="faq-question"
              onClick={() => setOpenId(open ? null : item.id)}
            >
              <span>{item.question}</span>
              <span className="faq-icon">+</span>
            </button>
            <div className="faq-answer">
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
