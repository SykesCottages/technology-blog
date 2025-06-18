---
title: "How I Use AI in QA: From Homework to Smarter Testing"
authors: Manu Bhardwaj
---

## It Started with Homework

One evening, my 8-year-old forgot his homework sheet at school. Parents in our group chat kindly shared photos, but printing from a phone image was tricky and time-consuming.

So, I tried something different — I uploaded the image to ChatGPT.

To my surprise, the AI didn’t just extract the content. It asked:

> “Do you want lines, formatting, same layout?”

In just seconds, it recreated the homework sheet in a clean, printable format.

That one small moment made me pause and think:

**If AI can do this for homework, what can it do for test cases at work?**

---

## Applying AI to QA Work

As a mobile QA tester, I decided to test ChatGPT’s abilities in writing test cases. I started with simple prompts and gradually refined my instructions to make them more specific and targeted. The results? Surprisingly effective.

This is where **prompt engineering** comes in…

> It’s the practice of crafting clear, specific prompts to get more accurate and usable outputs from AI.

Instead of asking vague questions, you guide the AI with context, formats, and expectations — just like briefing a junior team member.

---

## Real Benefits I Experienced

What started as a personal experiment became a valuable tool for our QA workflows. Here’s what I achieved for test case generation, using our internal AI tool:

- 🕒 **60% reduction in time** spent writing test cases
- 📋 **Better test coverage** with fewer missed edge cases and bugs
- 🔄 **More consistent output** across different QA teams
- 🤝 **Faster collaboration** with developers and product managers
- 📈 **Scalable across teams** – making QA more efficient company-wide

---

## How We Use Internal AI for QA Tasks

**Enter prompt. Example format:**

```
Write test cases for {{Platform}} using {{Requirements}}.  
Output format: ID, Title, Description, Expected Result, Test Result (empty). Tabulated.
```

![Test Case Generation prompt example](/img/postimages/ai-in-qa/QA-AI-Blog-Image-1.png)

- **Select platform type.** After submitting your prompt, the AI will guide you to choose the platform (e.g., iOS, Android, Website) and input your requirements or acceptance criteria.

- **Upload design or requirement files.** For better results, include designs, requirement documents, or any relevant resources.

- **Review the output.** Treat AI-generated content as a first draft — always review, refine, and validate before use.

---

## Putting Internal AI to Work: Smarter Password Validation Testing

Using our internal **ForgeGPT**, I select one of our pre-defined prompts. I replace the variable *Testing Requirements* with the detailed feature requirements from the feature specification.

I can also include design screenshots from Figma, which I refer to in the prompt. For example:

![Reset password screen](/img/postimages/ai-in-qa/QA-AI-Blog-Image-2.png)

The prompt then becomes something like:

![Full prompt with submit button](/img/postimages/ai-in-qa/QA-AI-Blog-Image-3.png)

After clicking 'Submit', I review the generated output for accuracy and completeness.

![Tabulated test cases](/img/postimages/ai-in-qa/QA-AI-Blog-Image-4.png)
![Tabulated test cases](/img/postimages/ai-in-qa/QA-AI-Blog-Image-5.png)

Since I’m testing for mobile applications, additional test cases specific to the app have also been generated in the table above.

---

## Final Thought

Think of AI as your **smart intern**:

It’s fast, capable, and helpful — but it still needs your guidance and review.

With the right prompts and clear inputs, AI can take care of repetitive tasks and give you more time to focus on what matters — testing deeper, smarter, and faster.

**Let’s work smarter. Let’s test better.**

---

## Next Step

The next step is to work towards generating **automated acceptance tests** for our website and mobile apps, then using **agentic-AI** for test case execution across our platforms.
