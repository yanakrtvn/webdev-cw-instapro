import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage } from "../index.js";
import { toggleLike } from "../api.js";
import { getToken } from "../index.js";
import { escapeHtml } from "../helpers.js";

export function renderPostsPageComponent({ appEl }) {
  const postsHtml = posts.length
    ? posts
        .map((post) => {
          const formattedDate = post.createdAt
            ? new Date(post.createdAt).toLocaleString()
            : "";

          // Обработка лайков
          let likesText = "";
          if (post.likes && Array.isArray(post.likes)) {
            const likesCount = post.likes.length;
            const likerNames = post.likes.map((like) => like.name);

            if (likesCount === 0) {
              likesText = "0";
            } else if (likesCount === 1) {
              likesText = likerNames[0];
            } else {
              likesText = `${likerNames[0]} и еще ${likesCount - 1}`;
            }
          } else if (typeof post.likes === "number") {
            likesText = post.likes > 0 ? `еще ${post.likes}` : "0";
          }
          return `
          <li class="post">
            <div class="post-header" data-user-id="${post.user.id}">
              <img src="${post.user.imageUrl}" class="post-header__user-image">
              <p class="post-header__user-name">${escapeHtml(post.user.name)}</p>
            </div>
            <div class="post-image-container">
              <img class="post-image" src="${post.imageUrl}">
            </div>
            <div class="post-likes">
              <button data-post-id="${post.id}" class="like-button">
                <img src="${
                  post.isLiked
                    ? "./assets/images/like-active.svg"
                    : "./assets/images/like-not-active.svg"
                }">
              </button>
              <p class="post-likes-text">
                Нравится: <strong>${likesText}</strong>
              </p>
            </div>
            <p class="post-text">
              <span class="user-name">${escapeHtml(post.user.name)}</span>
              ${escapeHtml(post.description)}
            </p>
            <p class="post-date">${formattedDate}</p>
          </li>
          `;
        })
        .join("")
    : "<p>Нет постов</p>";

  const appHtml = `
    <div class="page-container">
      <div class="header-container"></div>
      <ul class="posts">
        ${postsHtml}
      </ul>
    </div>
  `;

  appEl.innerHTML = appHtml;

  document.querySelectorAll(".like-button").forEach((button) => {
    button.addEventListener("click", () => {
      const postId = button.dataset.postId;
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      toggleLike({
        postId,
        token: getToken(),
        isLiked: post.isLiked,
      })
        .then((updatedPost) => {
          const updatedPosts = posts.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                isLiked: updatedPost.post.isLiked,
                likes: updatedPost.post.likes,
              };
            }
            return p;
          });
          posts.splice(0, posts.length, ...updatedPosts);
          renderPostsPageComponent({ appEl });
        })
        .catch((error) => {
          console.error("Ошибка при обновлении лайка:", error);
          alert("Только авторизованные пользователи могут лайкать посты");
        });
    });
  });

  document.querySelectorAll(".post-header").forEach((userEl) => {
    userEl.addEventListener("click", () => {
      goToPage(USER_POSTS_PAGE, {
        userId: userEl.dataset.userId,
      });
    });
  });

  renderHeaderComponent({
    element: document.querySelector(".header-container"),
  });
}
