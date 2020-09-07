import { Transaction, QueryTypes } from 'sequelize';
import { flatten } from 'lodash';
import db from '../../db/config/db.config';
import { getEmployeeIdByAccountId, getUserIdByAccountId } from '../../common/utils/account.utils';
import { getOrderRoutePoints } from '../orders/orders.utils';
import { accountNotFoundError } from '../../common/constants/error-messages/accounts.error-messages';
import { commentsNotFoundError } from '../../common/constants/error-messages/comments.error-messages';
import { EmployeeStatusEnum } from '../../common/enums/employee.enum';
import { employeesNotFoundError } from '../../common/constants/error-messages/employees.error-messages';
import { orderNotFoundError, ordersNotFoundError } from '../../common/constants/error-messages/orders.error-messages';

const getOrderUserId = async (orderId: string): Promise<number> => {
  const query = `
    SELECT far_trip.orders.user_id
    FROM far_trip.orders
    WHERE far_trip.orders.id = :orderId;
  `;
  const queryResult: any = await db.sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { orderId: +orderId },
    plain: true
  });

  return queryResult.user_id;
};

const getOrderUser = async (userId: number): Promise<any> => {
  const query = `
    SELECT accounts.name, accounts.email, accounts.logo
    FROM users
    INNER JOIN accounts ON users.account_id = accounts.id
    WHERE users.id = :userId;
  `;
  const queryResult: any = await db.sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { userId: +userId },
    plain: true
  });

  return queryResult;
};

const getCommentsUserNames = (comments: any[]) => {
  const query = `
    SELECT far_trip.accounts.name
    FROM far_trip.users
    INNER JOIN far_trip.accounts ON far_trip.accounts.id = far_trip.users.account_id
    WHERE far_trip.users.id = :userId
  `;
  const queryPromises: any[] = [];

  comments.forEach((comment: any) => {
    queryPromises.push(
      db.sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: { userId: comment.userId }
      })
    );
  });

  return Promise.all(queryPromises);
};

const getCommentById = async (commentId: number): Promise<any> => {
  const query = `
    SELECT
      far_trip.accounts.name AS userName,
      far_trip.comments.comment,
      far_trip.comments.created_date_time AS createdDate
    FROM far_trip.comments
    INNER JOIN far_trip.users ON far_trip.users.id = far_trip.comments.user_id
    INNER JOIN far_trip.accounts ON far_trip.accounts.id = far_trip.users.account_id
    WHERE far_trip.comments.id = :commentId;
  `;
  const queryResult: any = await db.sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
    replacements: { commentId }
  });

  return queryResult;
};

export const getEmployees = async (): Promise<object[]> => {
  const query = `
    SELECT
      accounts.id,
      accounts.email,
      accounts.name,
      accounts.age,
      accounts.logo,
      employees.status,
      cars.model,
      cars.note
    FROM employees
    INNER JOIN accounts ON employees.account_id = accounts.id
    INNER JOIN cars ON cars.employee_id = employees.id;
  `;
  const queryResult = await db.sequelize.query(query, {
    type: QueryTypes.SELECT
  });

  if (!queryResult.length) {
    return Promise.reject(employeesNotFoundError);
  }

  return queryResult;
};

export const getEmployee = async (accountId: any): Promise<any> => {
  const query = `
    SELECT
      accounts.id,
      accounts.name,
      accounts.email,
      accounts.age,
      employees.status,
      employees.cost_per_km,
      employees.work_description,
      accounts.logo,
      cars.model,
      cars.note,
      cars.image
    FROM employees
    INNER JOIN accounts ON employees.account_id = accounts.id
    INNER JOIN cars ON cars.employee_id = employees.id
    WHERE accounts.id = :accountId;
  `;
  const queryResult: any = await db.sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { accountId },
    plain: true
  });

  if (!queryResult) {
    return Promise.reject(accountNotFoundError);
  }

  return {
    id: queryResult.id,
    name: queryResult.name,
    email: queryResult.email,
    age: queryResult.age,
    logo: queryResult.logo,
    status: queryResult.status,
    costPerKm: queryResult.cost_per_km,
    workDescription: queryResult.work_description,
    car: { model: queryResult.model, note: queryResult.note, image: queryResult.image }
  };
};

export const getOrdersData = async (id: string): Promise<any> => {
  const query = `
    SELECT
      far_trip.accounts.name,
      far_trip.orders.id,
      far_trip.orders.user_id AS userId,
      far_trip.orders.departure,
      far_trip.orders.destination,
      far_trip.orders.distance,
      far_trip.orders.cost,
      far_trip.orders.status,
      far_trip.orders.spend_time AS spendTime
    FROM far_trip.employees
    INNER JOIN far_trip.accounts ON far_trip.employees.account_id = far_trip.accounts.id
    INNER JOIN far_trip.orders ON far_trip.orders.employee_id = far_trip.employees.id
    WHERE far_trip.accounts.id = :accountId
    ORDER BY far_trip.orders.status;
  `;
  const queryResult = await db.sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { accountId: +id }
  });

  if (!queryResult.length) {
    return Promise.reject(ordersNotFoundError);
  }

  return queryResult;
};

export const getOrderData = async (accountId: string, orderId: string): Promise<any> => {
  const query = `
    SELECT
      far_trip.orders.id,
      far_trip.orders.departure,
      far_trip.orders.destination,
      far_trip.orders.distance,
      far_trip.orders.cost,
      far_trip.orders.status,
      far_trip.orders.spend_time AS spendTime
    FROM far_trip.employees
    INNER JOIN far_trip.accounts ON far_trip.employees.account_id = far_trip.accounts.id
    INNER JOIN far_trip.orders ON far_trip.orders.employee_id = far_trip.employees.id
    WHERE far_trip.accounts.id = :accountId AND far_trip.orders.id = :orderId;
  `;
  const queryResult: any = await db.sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { accountId: +accountId, orderId: +orderId },
    plain: true
  });

  if (!queryResult) {
    return Promise.reject(orderNotFoundError);
  }

  const userId = await getOrderUserId(orderId);
  const user = await getOrderUser(userId);
  const orderRoutePoints = await getOrderRoutePoints(queryResult.id);

  return { ...queryResult, routePoints: orderRoutePoints, name: user.name, email: user.email, logo: user.logo };
};

export const getCommentsData = async (accountId: string): Promise<any> => {
  const query = `
    SELECT
      far_trip.comments.id,
      far_trip.comments.comment,
      far_trip.comments.created_date_time AS createdDate,
      far_trip.comments.user_id AS userId
    FROM far_trip.employees
    INNER JOIN far_trip.comments ON far_trip.employees.id = far_trip.comments.employee_id
    WHERE far_trip.employees.account_id = :accountId;
  `;
  const queryResult = await db.sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { accountId }
  });

  if (!queryResult.length) {
    return Promise.reject(commentsNotFoundError);
  }

  const commentsUserNames = await getCommentsUserNames(queryResult);

  const result = queryResult.map((commentItem: any, index: number) => ({
    id: commentItem.id,
    comment: commentItem.comment,
    createdDate: commentItem.createdDate,
    userName: flatten(commentsUserNames)[index].name
  }));

  return result;
};

export const updateCarData = async (accountId: string, data: any): Promise<any> => {
  return db.sequelize.transaction<any>(async (transaction: Transaction) => {
    const query = `
      UPDATE
        cars
      INNER JOIN
        employees
      ON
        employees.id = cars.employee_id
      INNER JOIN
        accounts
      ON
        employees.account_id = accounts.id
      SET
        cars.model = :carModel,
        cars.note = :carNote
      WHERE
        accounts.id = :accountId;
    `;
    await db.sequelize.query(query, {
      type: QueryTypes.UPDATE,
      replacements: { accountId: +accountId, carModel: data.model, carNote: data.note },
      transaction
    });
  });
};

export const saveEmployee = async (accountId: any, employeeData: any): Promise<void> => {
  return db.sequelize.transaction<void>(async (transaction: Transaction) => {
    const query = `
      INSERT INTO employees (account_id, status, rating, created_date_time, modified_date_time, work_description, cost_per_km)
      VALUES (?);
    `;
    const queryResult = await db.sequelize.query(query, {
      type: QueryTypes.INSERT,
      replacements: [
        [accountId, EmployeeStatusEnum.OutOfWork, 0.0, new Date(), new Date(), employeeData.workDescription, employeeData.costPerKm]
      ],
      transaction
    });

    saveCar(queryResult[0]);
  });
};

const saveCar = async (employee_id: number): Promise<void> => {
  return db.sequelize.transaction<void>(async (transaction: Transaction) => {
    const query = `
      INSERT INTO cars (employee_id, created_date_time, modified_date_time)
      VALUES (?);
    `;
    await db.sequelize.query(query, {
      type: QueryTypes.INSERT,
      replacements: [
        [employee_id, new Date(), new Date()]
      ],
      transaction
    });
  });
};

export const createCommentData = async (employeeAccountId: string, userAccountId: string, comment: any): Promise<any> => {
  const employeeId = await getEmployeeIdByAccountId(employeeAccountId);
  const userId = await getUserIdByAccountId(userAccountId);
  const createdCommentId = await db.sequelize.transaction<any>(async (transaction: Transaction) => {
    const query = `
      INSERT INTO comments (user_id, employee_id, comment, created_date_time, modified_date_time)
      VALUES (?)
    `;
    const queryResult = await db.sequelize.query(query, {
      type: QueryTypes.INSERT,
      replacements: [
        [userId, employeeId, comment.comment, new Date(), new Date()]
      ],
      transaction
    });

    return queryResult[0];
  });
  const createdComment = await getCommentById(createdCommentId);

  return createdComment;
};

export const updateEmployee = async (accountId: string, data: any): Promise<any> => {
  return db.sequelize.transaction<any>(async (transaction: Transaction) => {
    const query = `
      UPDATE
        accounts
      INNER JOIN
        employees
      ON
        employees.account_id = account.id
      SET
        accounts.name = :accountName,
        accounts.email = :accountEmail,
        accounts.age = :accountAge,
        employees.status = :employeeStatus
      WHERE
        accounts.id = :accountId
    `;
    const queryResult = await db.sequelize.query(query, {
      type: QueryTypes.UPDATE,
      replacements: {
        accountName: data.name,
        accountEmail: data.email,
        accountAge: data.age,
        employeeStatus: data.status,
        accountId: +accountId
      },
      transaction
    });

    return queryResult;
  });
};

export const updateEmployeeCar = async (accountId: string, image: Buffer) => {
  return db.sequelize.transaction(async () => {
    const query = `
      UPDATE accounts
      INNER JOIN employees ON employees.account_id = accounts.id
      INNER JOIN cars ON cars.employee_id = employees.id
      SET cars.image = ?, cars.modified_date_time = ?
      WHERE accounts.id = ?;
    `;

    await db.sequelize.query(query, {
      type: QueryTypes.UPDATE,
      replacements: [image, new Date(), accountId]
    });

    return image;
  });
};

export const removeEmployeeCar = async (accountId: string): Promise<any> => {
  return db.sequelize.transaction(async () => {
    const query = `
      UPDATE cars
      SET cars.image = NULL
      INNER JOIN employees ON employees.id = cars.employee_id
      INNER JOIN accounts ON accounts.id = employees.account_id
      WHERE accounts.id = ?;
    `;
    await db.sequelize.query(query, {
      type: QueryTypes.UPDATE,
      replacements: { accountId }
    });
  });
};
