# Start from the official lightweight Nginx image
FROM nginx:alpine

# Remove the default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/

# Copy static files into the directory Nginx serves from
COPY static/ /usr/share/nginx/html/

# Expose port 80 for HTTP traffic
EXPOSE 80
