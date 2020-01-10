'use strict';

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

// Log `title` of current active web page
const pageTitle = document.head.getElementsByTagName('title')[0].innerHTML;
console.log(
  `Page title is: '${pageTitle}' - evaluated by Chrome extension's 'contentScript.js' file`
);

// Communicate with background file by sending a message
chrome.runtime.sendMessage(
  {
    type: 'GREETINGS',
    payload: {
      message: 'Hello, my name is Con. I am from ContentScript.',
    },
  },
  response => {
    console.log(response.message);
  }
);

// Listen for message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'COUNT') {
    console.log(`Current count is ${request.payload.count}`);
  }

  // Send an empty response
  // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
  sendResponse({});
  return true;
});
/*
memo
yt-live-chat-app #items.yt-live-chat-item-list-renderer yt-live-chat-text-message-renderer
*/
let comment = [];
let kyoriW = 1000;
let kyoriH = 500;
setTimeout(
  function () {
    setInterval(function () {
      const iframe = document.querySelector('ytd-live-chat-frame iframe');
      if (iframe == null) {
        $('.meteor-comment').remove();
        return;
      }
      const doc_ = iframe.contentWindow.document;
      if (!Object.is(window.doc, doc_)) {
        // チャットのDOMが異なっていたら, 画面内のチャットを一掃する.
        console.log('changed iframe document.');
        const $comment = $('.meteor-comment');
        $comment.css({
          'transition': 'all 1000ms ease-out 0s',
        });
        setTimeout(() => {
          // 画面外へ飛ばす.
          $comment.css({
            'transform': 'translate(' + (-kyoriW * 2) + 'px,' + (-kyoriH * 2) + 'px)',
            'opacity': '0'
          });
        }, 1);
        // 新着チャットを判定できるように初期化.
        window.lastChatId = null;
      }
      window.doc = doc_;
      // document.querySelectorAll('.yt-live-chat-item-list-renderer');
      const items = window.doc.querySelectorAll('yt-live-chat-text-message-renderer,yt-live-chat-paid-message-renderer');
      // const paids = window.doc.querySelectorAll('yt-live-chat-paid-message-renderer');
      // const members = window.doc.querySelectorAll('yt-live-chat-legacy-paid-message-renderer');

      let array = [];
      let isCheck = false;
      const video = document.querySelector('video');
      kyoriW = video.clientWidth;
      kyoriH = video.clientHeight;
      items.forEach(function (item) {
        const obj = {
          timestamp: item.querySelector('#timestamp').innerText,
          text: item.querySelector('#message').innerHTML,
          id: item.id,
          author: {
            photo: item.querySelector('#author-photo img').getAttribute('src'),
            name: item.querySelector('#author-name').innerText,
          },
          amount: item.querySelector('#purchase-amount') != null ? item.querySelector('#purchase-amount').innerText : null,
          x: video.clientWidth,
          y: video.clientHeight,
        };
        // 未セット==初実行か, 以降新着コメントなら.
        if (window.lastChatId == null || obj.id === window.lastChatId) {
          isCheck = true;
          // return;
        }
        if (!isCheck) { return; }
        // 新着コメントを記録.
        array.push(obj);
      });
      // lastChatIdが1件もヒットしない==時間を飛ばすなどして大きくチャット内容が変化したor時間を巻き戻した.
      if (!isCheck) {
        console.log('changed chat history.');
        window.lastChatId == null;
        window.doc = null;
      }
      if (array.length > 1) {
        window.lastChatId = array[array.length - 1].id;
        array.shift(); // 新着に1件古い情報が入ってしまうため除去.
        comment.push(...array);
        console.log(array);
      }
    }, 500);
    const container = '<div id="mlc-container" style="overflow:hidden; position:absolute; pointer-events:none;"></div>';
    document.querySelector('body').insertAdjacentHTML('beforeend', container);
    const body = document.querySelector('#mlc-container');
    setInterval(() => {
      const video = document.querySelector('video');
      const rect = video.getBoundingClientRect();

      $(body).css({
        width: '' + kyoriW + 'px',
        height: '' + kyoriH + 'px',
        left: '' + window.pageXOffset + rect.left + 'px',
        top: '' + window.pageYOffset + rect.top + 'px',
      });
      comment.forEach(obj => {
        const html = $('<div>');
        html.addClass('meteor-comment-set');
        html.css({
          'position': 'absolute',
          'left': '' + 100 + '%',
          'top': '' + Math.floor(Math.random() * 95) + '%',
          // 'z-index': '' + 10001,
          'color': '#fff',
          'text-shadow': '1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000',
          'transition': 'all 20s 0s linear',
          'max-width': '' + 1000 + 'px',
          'white-space': 'nowrap',
          'font-size': '' + 3.0 + 'em',
        });
        let amount = '';
        if (obj.amount != null) {
          html.css('color', '#ffb300');
          amount = '<span style="color:#fff;font-size:0.5em">' + obj.amount + '</span>';
        }
        const img = '<img src="' + obj.author.photo + '" style="width:1em;height:1em;" >';
        html.html('' + img + amount + obj.text);
        body.insertAdjacentElement('beforeend', html.get(0));
      });
      comment = [];

      setTimeout(() => {
        const mcs = $('.meteor-comment-set');
        mcs.css('transform', 'translateX(' + (-kyoriW * 2) + 'px)');
        mcs.addClass('meteor-comment');
        mcs.removeClass('meteor-comment-set');
      }, 100); // 10とかだと短すぎる.
    }, 500);
  }, 2000
);
$(document).on('transitionend', '.meteor-comment', e => {
  $(e.target).each(function (i, e) {
    $(e).remove();
  });
});
// items.item(233).querySelector('#message').innerText
