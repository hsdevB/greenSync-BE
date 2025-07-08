import createError from 'http-errors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import indexRouter from './routes/index.js';
// import usersRouter from './routes/users.js';

import db from './models/index.js';

// ES6에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// 개발 환경에서 테이블 생성/수정을 위한 sync 옵션
const syncOptions = {
  force: true,  // true로 설정하면 기존 테이블을 삭제하고 재생성
  alter: false    // true로 설정하면 테이블 구조를 변경
};

db.sequelize
  .sync(syncOptions)
  .then(() => {
    console.log("DB 연결 완료 및 테이블 동기화 성공");
    
    // 생성된 테이블 목록 확인
    return db.sequelize.getQueryInterface().showAllTables();
  })
  .then((tableNames) => {
    console.log("생성된 테이블 목록:", tableNames);
  })
  .catch((err) => {
    console.error("DB 연결 또는 테이블 생성 실패:", err);
    process.exit(1);  // 실패시 프로세스 종료
  });

export default app;