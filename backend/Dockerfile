FROM public.ecr.aws/lambda/python:3.12 AS build
 
WORKDIR /app
 
COPY requirements.txt .
 
RUN pip install --no-cache-dir -r requirements.txt
 
FROM public.ecr.aws/lambda/python:3.12
 
WORKDIR /var/task
 
COPY --from=build /var/lang/lib/python3.12/site-packages /var/lang/lib/python3.12/site-packages
 
COPY . /var/task/
 
CMD ["main.lambda_handler"]