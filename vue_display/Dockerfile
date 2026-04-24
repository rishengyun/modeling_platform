FROM nginx:1.27.3
WORKDIR /usr/share/nginx/html
USER root
COPY ./dist/ .
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]