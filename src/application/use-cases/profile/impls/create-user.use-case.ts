import { Injectable } from "@nestjs/common";
import User, { UserStatus } from "src/domain/entities/user-entity";
import { Cart } from "src/domain/entities/cart.entity";
import { Wishlist } from "src/domain/entities/wishlist.entity";
import { UserAlreadyExistException } from "src/domain/exceptions";
import { IUserRepository } from "src/domain/repositories/user.repository";
import { ICartRepository } from "src/domain/repositories/cart.repository";
import { IWishlistRepository } from "src/domain/repositories/wishlist.repository";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { Wallet } from "src/domain/entities/user-wallet.entity";
import { IWalletRepository } from "src/domain/repositories/wallet.repository";
import { UserAccountCreatedEvent } from "src/domain/events/user-created.event";
import { ICreateUserUseCase } from "../interfaces/create-user.interface";

@Injectable()
export default class CreateUserUseCase implements ICreateUserUseCase {
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _cartRepository: ICartRepository,
    private readonly _wishlistRepository: IWishlistRepository,
    private readonly _walletRepository: IWalletRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  public async execute(dto: UserAccountCreatedEvent): Promise<User> {
    return this._tracer.startActiveSpan(
      "CreateUserUseCase.execute",
      async (span) => {
        const { payload } = dto;

        span.setAttribute("user.email", payload.email);

        // Check if the user already exists with the provided email
        const alreadyExist = await this._userRepository.findByEmail(
          payload.email,
        );
        if (alreadyExist) {
          this._logger.debug(
            `User already exists with the email: ${payload.email}`,
          );
          span.setAttribute("email.exist", true);
          throw new UserAlreadyExistException(
            `User already exists with ${payload.email}`,
          );
        }
        this._logger.debug(
          `No existing user found with email: ${payload.email}`,
        );
        span.setAttribute("email.exist", false);

        // Create user entity
        const user = User.create({
          id: payload.userId,
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          avatar: payload.avatar,
          status: UserStatus.VERIFIED,
          roles: payload.roles,
          createdAt: payload.createdAt,
        });

        this._logger.debug("Saving user data to repository for registration", {
          email: payload.email,
        });

        // await Promise.all([
        await this._userRepository.save(user);
        await this.createInitialUserAssets(user.id);
        // ]);

        this._logger.debug("Completed user creation", {
          email: payload.email,
          ctx: CreateUserUseCase.name,
        });

        return user;
      },
    );
  }

  // Helper to encapsulate setup of initial user assets (cart, wishlist, wallet)
  private async createInitialUserAssets(userId: string): Promise<void> {
    return this._tracer.startActiveSpan(
      "CreateUserUseCase.createInitialUserAssets",
      async (span) => {
        span.setAttributes({
          "user.id": userId,
        });

        try {
          const cart = Cart.create({
            userId,
            items: [],
          });
          const wishlist = Wishlist.create({
            userId,
            items: [],
          });
          const wallet = Wallet.createInitial(userId, "INR");

          // await Promise.all([
          await this._cartRepository.create(cart);
          await this._wishlistRepository.create(wishlist);
          await this._walletRepository.save(wallet);
          // ]);

          this._logger.debug(
            `Created cart, wishlist, and wallet for user ${userId}`,
            {
              userId,
              cartId: cart.id,
              wishlistId: wishlist.id,
              ctx: CreateUserUseCase.name,
            },
          );

          span.setAttributes({
            "cart.id": cart.id,
            "wishlist.id": wishlist.id,
            "wallet.id": wallet.id,
            "cart.created": true,
            "wishlist.created": true,
            "wallet.created": true,
          });
        } catch (error) {
          this._logger.error(
            `Failed to create cart, wallet, or wishlist for user ${userId}`,
            {
              userId,
              error,
              ctx: CreateUserUseCase.name,
            },
          );
          span.setAttributes({
            "cart.created": false,
            "wishlist.created": false,
            "wallet.created": false,
          });
          throw error;
        }
      },
    );
  }
}
