// Gmail Expenses: Gmail access.
// author: @victormarcias
//
// Labels are applied per message with the Gmail advanced service: GmailApp
// only labels whole threads, and monthly emails (statements, bills) usually
// end up in the same thread.

// Inbox emails that aren't labeled yet, however old, plus the labeled ones
// received after `labeledSince` (unix seconds) when it's given.
function findMessageIds(source, labeledSince) {
  const terms = ['in:inbox', source.anySender ? source.query : `from:"${source.from}"`];
  const unlabeled = `-label:${searchName(LABEL)}`;
  terms.push(labeledSince ? `(after:${labeledSince} OR ${unlabeled})` : unlabeled);
  const query = terms.join(' ');

  const ids = [];
  let pageToken;
  do {
    const page = Gmail.Users.Messages.list('me', { q: query, pageToken });
    (page.messages || []).forEach((message) => ids.push(message.id));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return ids;
}

// The From and Subject of a message, without downloading its body
function messageHeaders(id) {
  const { payload } = Gmail.Users.Messages.get('me', id, {
    format: 'metadata',
    metadataHeaders: ['From', 'Subject'],
  });
  const header = (name) => {
    const found = (payload.headers || []).find((h) => h.name.toLowerCase() === name);
    return found ? found.value : '';
  };
  return { from: header('from'), subject: header('subject') };
}

function markMessages(ids, id) {
  // batchModify takes up to 1000 ids
  for (let i = 0; i < ids.length; i += 1000) {
    Gmail.Users.Messages.batchModify({ ids: ids.slice(i, i + 1000), addLabelIds: [id] }, 'me');
  }
}

// The id of LABEL, created if missing
function labelId() {
  const label = (Gmail.Users.Labels.list('me').labels || []).find((l) => l.name === LABEL);
  return (label || Gmail.Users.Labels.create({ name: LABEL }, 'me')).id;
}

// Gmail search writes label "A/B c" as a-b-c
function searchName(label) {
  return label.toLowerCase().replace(/[\/\s]/g, '-');
}
