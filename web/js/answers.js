export class Answers {
  constructor(channel) {
    this.channel = channel;
  }

  get members() {
    return this.channel.members.filter((m) => !m.user.bot);
  }

  async expectAnswers(time, memberQuestions, { onUserDone, prefix = '' } = {}) {
    const results = new Map();
    await Promise.allSettled(
      this.members.map(async (member) => {
        return new Promise(async (resolve) => {
          const answers = [];
          const start = Date.now();
          setTimeout(() => {
            results.set(member.id, answers);
            window.client.dmUpdates.delete(member.id);
            resolve();
          }, time);
          let remainingQuestions = [...memberQuestions.get(member.id || [])]; // You have to clone this array otherwise stuff does not work
          if (remainingQuestions[0]) {
            await window.client.send(
              member.id,
              prefix + remainingQuestions.shift().replace(/_/g, '\\_')
            );
            window.client.dmUpdates.set(member.id, async (message) => {
              if (message.content) {
                answers.push(message.content);
                if (remainingQuestions.length === 0) {
                  results.set(member.id, answers);
                  window.client.dmUpdates.delete(member.id);
                  resolve();
                  if (onUserDone) onUserDone(member.id);
                  return;
                }
                await window.client.send(
                  member.id,
                  prefix + remainingQuestions.shift().replace(/_/g, '\\_')
                );
              }
            });
          }
        });
      })
    );
    return results;
  }

  async expectVotes(time, questions, reactions) {
    // reactions is a list of strings to expect
    const results = new Map();
    await Promise.allSettled(
      this.members.map(async (member) => {
        return new Promise(async (resolve) => {
          let answer;
          const question = questions.get(member.id);
          if (!question) {
            resolve();
            return;
          }
          await window.client.send(member.id, question[0]);
          const start = Date.now();
          setTimeout(() => {
            results.set(member.id, answer);
            resolve();
          }, time);
          window.client.dmUpdates.set(member.id, async (message) => {
            if (
              message.content &&
              reactions.includes(message.content.toLowerCase())
            ) {
              answer = message.content.toLowerCase();
              results.set(member.id, answer);
              window.client.dmUpdates.delete(member.id);
              resolve();
            }
          });
        });
      })
    );
    return results;
  }
}
